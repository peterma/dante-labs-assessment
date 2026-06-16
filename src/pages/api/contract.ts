import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Default contract: WETH on Ethereum Mainnet — overridable via query param or env var.
const DEFAULT_CONTRACT = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const DEFAULT_CHAIN_ID = '0x1';

// Public Ethereum JSON-RPC gateways (no API key required for read-only calls)
const RPC_ENDPOINTS = [
  'https://eth.llamarpc.com',
  'https://ethereum.publicnode.com',
  'https://rpc.ankr.com/eth',
];

// Function selectors (keccak256 of ABI signature, first 4 bytes)
const SEL = {
  name:        '0x06fdde03',
  symbol:      '0x95d89b41',
  decimals:    '0x313ce567',
  totalSupply: '0x18160ddd',
};

// ── Rate limiter ─────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(rawIp: string): boolean {
  const ip = rawIp === '::1' ? '127.0.0.1' : rawIp;
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateLimitMap.set(ip, entry);
  }
  return ++entry.count <= RATE_LIMIT;
}

// ── Chain ID cache (≈5 min TTL) ──────────────────────────────────────────────
let chainIdCache: { value: string; ts: number } | null = null;
const CHAIN_ID_CACHE_TTL_MS = 5 * 60_000;

// ── RPC helpers ──────────────────────────────────────────────────────────────
async function rpcPost(url: string, payload: object): Promise<string> {
  const { data } = await axios.post(url, payload, { timeout: 8000 });
  if (data.error) throw new Error(data.error.message ?? 'RPC error');
  return data.result as string;
}

async function ethCall(selector: string, contractAddress: string, deadline: number): Promise<string> {
  let lastError: Error = new Error('All RPC endpoints failed');
  for (const url of RPC_ENDPOINTS) {
    if (Date.now() >= deadline) throw new Error('Request deadline exceeded');
    try {
      return await rpcPost(url, {
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: contractAddress, data: selector }, 'latest'],
        id: 1,
      });
    } catch (err: any) {
      lastError = err;
    }
  }
  throw lastError;
}

async function fetchChainId(deadline: number): Promise<string> {
  const now = Date.now();
  if (chainIdCache && now < chainIdCache.ts + CHAIN_ID_CACHE_TTL_MS) {
    return chainIdCache.value;
  }
  let lastError: Error = new Error('Could not fetch chainId');
  for (const url of RPC_ENDPOINTS) {
    if (Date.now() >= deadline) throw new Error('Request deadline exceeded');
    try {
      const result = await rpcPost(url, {
        jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1,
      });
      chainIdCache = { value: result, ts: Date.now() };
      return result;
    } catch (err: any) {
      lastError = err;
    }
  }
  throw lastError;
}

// ── ABI decoders ─────────────────────────────────────────────────────────────

// Safely decode ABI uint256 / uint8; returns 0n for empty / zero-only responses.
function decodeUint(hex: string): bigint {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (!clean) return 0n;
  if (!/^[0-9a-fA-F]+$/.test(clean)) {
    throw new Error(`Invalid hex in uint decode: ${hex}`);
  }
  return BigInt('0x' + clean);
}

// Decode bytes32 — trim null bytes, used as fallback for legacy tokens.
function decodeBytes32(raw: string): string {
  return Buffer.from(raw.slice(0, 64).padEnd(64, '0'), 'hex')
    .toString('utf8')
    .replace(/\0/g, '')
    .trim();
}

// Decode ABI-encoded dynamic string with bounds checking and bytes32 fallback.
function decodeString(hex: string): string {
  const raw = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (raw.length < 64) return decodeBytes32(raw);

  const offset = parseInt(raw.slice(0, 64), 16);
  // offset must be 32 for a single dynamic-string return value
  if (offset !== 32) return decodeBytes32(raw);

  const dataStart = offset * 2; // nibble index
  if (raw.length < dataStart + 64) return decodeBytes32(raw);

  const byteLen = parseInt(raw.slice(dataStart, dataStart + 64), 16);
  if (byteLen === 0) return '';

  const strStart = dataStart + 64;
  // Clamp to available data rather than throwing
  const available = Math.floor((raw.length - strStart) / 2);
  const readLen = Math.min(byteLen, available);
  return Buffer.from(raw.slice(strStart, strStart + readLen * 2), 'hex').toString('utf8');
}

// ── Formatter ────────────────────────────────────────────────────────────────

// Locale-independent thousands separator.
function withCommas(n: string): string {
  return n.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format raw token amount without floating-point loss.
function formatAmount(raw: bigint, decimals: number): string {
  if (decimals === 0) return withCommas(raw.toString());
  const divisor = BigInt('1' + '0'.repeat(decimals));
  const whole = raw / divisor;
  const frac = (raw % divisor).toString().padStart(decimals, '0').slice(0, 4);
  return `${withCommas(whole.toString())}.${frac}`;
}

// ── Handler ──────────────────────────────────────────────────────────────────

export type ContractData = {
  contract: string;
  network: string;
  chainId: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  totalSupplyRaw: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContractData | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting — use the real TCP peer, not the spoofable X-Forwarded-For header.
  const rawIp = req.socket.remoteAddress ?? 'unknown';
  if (!checkRateLimit(rawIp)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });
  }

  // Configurable contract and chain — query param → env var → default
  const contractAddress =
    (req.query.contract as string | undefined) ||
    process.env.ETH_CONTRACT_ADDRESS ||
    DEFAULT_CONTRACT;
  const expectedChainId =
    (req.query.chainId as string | undefined) ||
    process.env.ETH_CHAIN_ID ||
    DEFAULT_CHAIN_ID;

  const deadline = Date.now() + 12_000; // 12s global deadline across all retries

  try {
    // Verify chain ID against expected value (cached ~5 min)
    const actualChainId = await fetchChainId(deadline);
    if (actualChainId.toLowerCase() !== expectedChainId.toLowerCase()) {
      return res.status(502).json({
        error: `Chain ID mismatch: expected ${expectedChainId}, got ${actualChainId}`,
      });
    }

    // Fire all four read-only calls in parallel — no gas, no wallet needed
    const [nameHex, symbolHex, decimalsHex, totalSupplyHex] = await Promise.all([
      ethCall(SEL.name, contractAddress, deadline),
      ethCall(SEL.symbol, contractAddress, deadline),
      ethCall(SEL.decimals, contractAddress, deadline),
      ethCall(SEL.totalSupply, contractAddress, deadline),
    ]);

    const decimals = Number(decodeUint(decimalsHex));
    const totalSupplyRaw = decodeUint(totalSupplyHex);

    res.setHeader('Cache-Control', 'public, max-age=30');
    return res.status(200).json({
      contract: contractAddress,
      network: 'Ethereum Mainnet',
      chainId: actualChainId,
      name: decodeString(nameHex),
      symbol: decodeString(symbolHex),
      decimals,
      totalSupply: formatAmount(totalSupplyRaw, decimals),
      totalSupplyRaw: totalSupplyRaw.toString(),
    });
  } catch (err: any) {
    const message = err?.response?.data?.error?.message ?? err?.message ?? 'Unknown error';
    return res.status(500).json({ error: `Failed to fetch contract data: ${message}` });
  }
}
