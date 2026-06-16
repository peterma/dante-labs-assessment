import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// WETH (Wrapped Ether) on Ethereum Mainnet — a well-known ERC-20 contract.
// In production this would be your own deployed contract address.
const CONTRACT_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

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

async function ethCall(selector: string): Promise<string> {
  let lastError: Error = new Error('All RPC endpoints failed');
  for (const url of RPC_ENDPOINTS) {
    try {
      const { data } = await axios.post(
        url,
        {
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{ to: CONTRACT_ADDRESS, data: selector }, 'latest'],
          id: 1,
        },
        { timeout: 8000 }
      );
      if (data.error) throw new Error(data.error.message);
      return data.result as string;
    } catch (err: any) {
      lastError = err;
    }
  }
  throw lastError;
}

// Decode ABI-encoded uint256 / uint8
function decodeUint(hex: string): bigint {
  return BigInt(hex);
}

// Decode ABI-encoded dynamic string
function decodeString(hex: string): string {
  const raw = hex.startsWith('0x') ? hex.slice(2) : hex;
  // Slot 0: offset pointer (always 0x20 = 32 for a single return value)
  const dataOffset = parseInt(raw.slice(0, 64), 16) * 2;
  // At offset: string byte length
  const byteLen = parseInt(raw.slice(dataOffset, dataOffset + 64), 16);
  // Followed by UTF-8 string bytes
  const strHex = raw.slice(dataOffset + 64, dataOffset + 64 + byteLen * 2);
  return Buffer.from(strHex, 'hex').toString('utf8');
}

// Format a raw token amount respecting decimals, no floating-point loss
function formatAmount(raw: bigint, decimals: number): string {
  const divisor = BigInt('1' + '0'.repeat(decimals));
  const whole = raw / divisor;
  const frac = raw % divisor;
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, 4);
  return `${whole.toLocaleString()}.${fracStr}`;
}

export type ContractData = {
  contract: string;
  network: string;
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

  try {
    // Fire all four read-only calls in parallel — no gas, no wallet needed
    const [nameHex, symbolHex, decimalsHex, totalSupplyHex] = await Promise.all([
      ethCall(SEL.name),
      ethCall(SEL.symbol),
      ethCall(SEL.decimals),
      ethCall(SEL.totalSupply),
    ]);

    const decimals = Number(decodeUint(decimalsHex));
    const totalSupplyRaw = decodeUint(totalSupplyHex);

    return res.status(200).json({
      contract: CONTRACT_ADDRESS,
      network: 'Ethereum Mainnet',
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
