import React, { Fragment, useEffect } from 'react';
import { Menu, Popover, Transition } from '@headlessui/react';
import { MenuIcon, XIcon } from '@heroicons/react/solid';
import Link from 'next/link';
import {
  AccountChooseValue,
  WalletButtonShowState,
  WalletListShowState,
  AccountConfigPageState,
  WalletAddress,
  NetWorkState,
  IntactWalletAddress,
  IsEmailAuthenticated,
} from '../../jotai';
import { useAtom } from 'jotai';
import { useRouter } from 'next/router';
import Login from '../login';
import Account from '../account';
import { address_slice } from '../../utils/chain/address';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const netWorkDefaults = [
  { id: 1, name: 'Mainnet', online: 'bg-green-400' },
  { id: 2, name: 'Testnet', online: 'bg-yellow-400' },
];

const isExternal = (href: string) => /^https?:\/\//.test(href);

const Trident = () => {
  const navigation = [
    {
      title: 'Dex',
      contents: [
        { name: 'Swap', href: '/home' },
        { name: 'Pools', href: '/pools' },
        { name: 'Create', href: '/create' },
        { name: 'Bridge', href: '/bridge' },
        { name: 'Farms', href: '/farms' },
        { name: 'Staking', href: '/staking' },
        { name: 'Mint', href: '/defi_mint' },
      ],
    },
    {
      title: 'Launchpad',
      contents: [
        { name: 'Home', href: '/launchpad' },
        { name: 'Next', href: '/nextido' },
        { name: 'History', href: '/historyido' },
      ],
    },
    {
      title: 'NFT',
      contents: [
        { name: 'Marketplaces', href: '/marketplaces' },
        { name: 'Details', href: '/details' },
        { name: 'Rankings', href: '/ranking' },
        { name: 'Auction', href: '/auction' },
        { name: 'Drops', href: '/drops' },
      ],
    },
    {
      title: 'Dao',
      contents: [
        { name: 'Democracy', href: '/home' },
        { name: 'Council', href: '/home' },
        { name: 'Treasury', href: '/home' },
        { name: 'Bounties', href: '/home' },
        { name: 'Technology', href: '/home' },
      ],
    },
    {
      title: 'Browser',
      contents: [
        { name: 'Explore', href: 'https://explorer-devnet.web3games.org/' },
        { name: 'Portal', href: 'https://portal.web3games.org/' },
        { name: 'Docs', href: 'https://docs.web3games.org/' },
      ],
    },
    {
      title: 'MultiPay',
      contents: [{ name: 'Home', href: '/multipay' }],
    },
  ];

  const TestNavigation = [{ name: 'Faucet', href: '/faucet' }];
  const [rawSelected] = useAtom(NetWorkState);
  const selected = rawSelected ?? netWorkDefaults[1];

  return (
    <div>
      <div className="xl:flex justify-center grid grid-cols-3 md:grid-cols-5">
        {navigation.map(item => (
          <Menu as="div" key={item.title} className="relative inline-block text-left font-semibold xl:mr-10">
            <div>
              <Menu.Button className="py-2.5 text-sm leading-5 w-24 xl:w-full text-center rounded-lg text-base font-medium text-gray-100 focus:ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-90 flex justify-center">
                {item.title}
                <i className="fa fa-angle-down ml-2 mt-0.5" aria-hidden="true" />
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="origin-top-right absolute mt-1 z-20 border-2 border-gray-800 rounded-md shadow-lg bg-black focus:outline-none">
                <div className="py-1">
                  {item.contents.map(contents => (
                    <Menu.Item key={contents.name}>
                      {({ active }) => (
                        <Link
                          href={contents.href}
                          target={isExternal(contents.href) ? '_blank' : undefined}
                          rel={isExternal(contents.href) ? 'noopener noreferrer' : undefined}
                          className={classNames(
                            active ? 'bg-gray-800 text-white' : 'text-gray-400',
                            'block px-4 py-2 text-sm whitespace-nowrap'
                          )}
                        >
                          {contents.name}
                        </Link>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        ))}
        <div>
          {TestNavigation.map(item => (
            <Link key={item.name} href={item.href}>
              <div className="py-2.5 text-sm leading-5 rounded-lg text-base font-medium text-gray-100 focus:ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-90 flex justify-center">
                {item.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const Header = () => {
  const router = useRouter();
  const [WalletButtonShow, SetWalletButtonShow] = useAtom(WalletButtonShowState);
  const [, SetOpenWalletListState] = useAtom(WalletListShowState);
  const [, SetAccountConfig] = useAtom(AccountConfigPageState);
  const [AccountChoose] = useAtom(AccountChooseValue);
  const [walletAddress, setWalletAddress] = useAtom(WalletAddress);
  const [intactWalletAddress] = useAtom(IntactWalletAddress);
  const [isEmailAuthenticated] = useAtom(IsEmailAuthenticated);

  useEffect(() => {
    if (!router.isReady) return;
    if (isEmailAuthenticated) {
      SetWalletButtonShow(true);
      setWalletAddress(intactWalletAddress); // intactWalletAddress holds the email
    } else if (AccountChoose === 0) {
      SetWalletButtonShow(false);
    } else {
      SetWalletButtonShow(true);
      setWalletAddress(address_slice(intactWalletAddress));
    }
  }, [router.isReady, AccountChoose, intactWalletAddress, isEmailAuthenticated]);

  const accountConfig = () => SetAccountConfig(true);
  const open_wallet_list = () => SetOpenWalletListState(true);

  return (
    <div>
      <header>
        <Login />
        <Account />
        <Popover className="relative">
          <div className="flex fixed z-20 inset-x-0 bg-black/80 backdrop-blur transition duration-700 mb-10 items-center justify-between p-3 px-5 md:px-10">
            {/* Left: Logo + Nav */}
            <div className="flex items-center">
              <Link href="/home">
                <span className="sr-only">Workflow</span>
                <img className="w-auto h-14" src="/web3logo.svg" alt="Web3Games" />
              </Link>
              <div className="hidden xl:flex items-center mt-1.5 ml-4">
                <Trident />
              </div>
            </div>

            {/* Right: hamburger (mobile) + wallet (desktop) */}
            <div className="flex items-center">
              {/* Mobile hamburger */}
              <div className="mr-2 my-0.5 xl:hidden">
                <Popover.Button className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                  <span className="sr-only">Open menu</span>
                  <MenuIcon className="h-6 w-6" aria-hidden="true" />
                </Popover.Button>
              </div>

              {/* Desktop wallet */}
              <div className="hidden xl:flex items-center">
                {/* Connect button — shown when not authenticated */}
                <div className={WalletButtonShow ? 'hidden' : 'mt-1'}>
                  <div className="p-0.5 rounded-lg bg-gradient-to-r from-[#D95F82] via-[#8273D7] to-[#729CEA]">
                    <button
                      onClick={open_wallet_list}
                      className="bg-[#151515] transition duration-700 w-44 py-2 text-white rounded-md flex justify-center"
                    >
                      Connect Wallet
                    </button>
                  </div>
                </div>

                {/* EVM / MetaMask badge */}
                <div className={WalletButtonShow && AccountChoose === 1 ? '' : 'hidden'}>
                  <div className="flex bg-neutral-800 rounded-full p-1 justify-center">
                    <div className="flex items-center mr-4 p-2">
                      <img
                        className="w-6 h-6 rounded-lg mx-1"
                        src="https://portal.web3games.org/_next/image?url=%2Fnetworks%2Fethereum-network.jpg&w=48&q=75"
                        alt=""
                      />
                      <div className="text-white w-16">Ethereum</div>
                    </div>
                    <button
                      onClick={accountConfig}
                      className="bg-neutral-700 rounded-full truncate w-40 px-4 py-2 text-white flex"
                    >
                      {walletAddress}
                    </button>
                  </div>
                </div>

                {/* Substrate badge */}
                <div className={WalletButtonShow && AccountChoose === 2 ? '' : 'hidden'}>
                  <div className="flex bg-neutral-800 rounded-full p-1 justify-center">
                    <div className="flex items-center mr-4 p-2">
                      <img className="w-6 h-6 rounded-lg mx-1" src="/substrate.svg" alt="" />
                      <div className="text-white w-16">Substrate</div>
                    </div>
                    <button
                      onClick={accountConfig}
                      className="bg-neutral-700 rounded-full truncate w-40 px-4 py-2 text-white flex"
                    >
                      {walletAddress}
                    </button>
                  </div>
                </div>

                {/* Email auth badge */}
                <div className={WalletButtonShow && isEmailAuthenticated && AccountChoose === 0 ? '' : 'hidden'}>
                  <div className="flex bg-neutral-800 rounded-full p-1 justify-center">
                    <div className="flex items-center mr-4 p-2">
                      <i className="fa fa-user-circle text-white text-xl mx-1" aria-hidden="true" />
                      <div className="text-white w-10">Email</div>
                    </div>
                    <div className="bg-neutral-700 rounded-full truncate w-40 px-4 py-2 text-white flex items-center">
                      {walletAddress}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile panel */}
          <div className="fixed z-20 inset-x-0">
            <Transition
              as={Fragment}
              enter="duration-200 ease-out"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="duration-100 ease-in"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Popover.Panel
                focus
                className="absolute fixed z-20 inset-x-0 min-h-screen transition transform origin-top-right xl:hidden"
              >
                <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-black transition duration-700 divide-y-2 divide-gray-400">
                  <div className="pt-5 pb-6 px-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <img className="h-10 w-auto" src="/logo.png" alt="Web3Games" />
                      </div>
                      <div className="mr-2">
                        <Popover.Button className="bg-gray-100 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                          <span className="sr-only">Close menu</span>
                          <XIcon className="h-6 w-6" aria-hidden="true" />
                        </Popover.Button>
                      </div>
                    </div>
                  </div>
                  <div className="py-6 px-8">
                    <Trident />
                  </div>
                  <div className="flex justify-center p-5 items-center">
                    <div className="w-full">
                      <div className="flex justify-center">
                        <Popover.Button
                          as="button"
                          onClick={open_wallet_list}
                          className="bg-gray-800 w-36 p-2 text-center text-white rounded-lg"
                        >
                          Connect Wallet
                        </Popover.Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </div>
        </Popover>
      </header>
    </div>
  );
};

export default Header;
