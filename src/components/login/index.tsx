import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useAtom } from 'jotai';
import {
  AccountChooseValue,
  WalletButtonShowState,
  WalletListShowState,
  WalletAddress,
  AfterSubstrateAddressList,
  IntactWalletAddress,
  IsEmailAuthenticated,
} from '../../jotai/index';
import { ExclamationIcon } from '@heroicons/react/solid';
import { address_slice } from '../../utils/chain/address';
import AuthModal from '../auth/AuthModal';

const Login = () => {
  const [OpenWalletListState, SetOpenWalletListState] = useAtom(WalletListShowState);
  const [, SetWalletButtonShow] = useAtom(WalletButtonShowState);
  const [, SetAccountChooseValue] = useAtom(AccountChooseValue);
  const [, setWalletAddress] = useAtom(WalletAddress);
  const [openSubstrateAddress, SetOpenSubstrateAddress] = useState(false);
  const [SubstrateAddressList, SetSubstrateAddressList] = useAtom(AfterSubstrateAddressList);
  const [, SetIntactWalletAddress] = useAtom(IntactWalletAddress);
  const [InstallSubstrate, setInstallSubstrate] = useState(false);
  const [InstallMetaMask, setInstallMetaMask] = useState(false);
  const [metaMaskError, setMetaMaskError] = useState('');
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const [, SetIsEmailAuthenticated] = useAtom(IsEmailAuthenticated);

  // Selected substrate address held in state instead of a mutable module-level variable
  const [selectedSubstrateAddress, setSelectedSubstrateAddress] = useState('');

  async function loginMetaMask() {
    setMetaMaskError('');
    try {
      // @ts-ignore
      if (!window.ethereum) {
        SetAccountChooseValue(0);
        setInstallMetaMask(true);
        return;
      }
      // @ts-ignore
      const accountArray = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accountArray && accountArray.length > 0) {
        const account = accountArray[0];
        SetAccountChooseValue(1);
        SetIntactWalletAddress(account);
        setWalletAddress(address_slice(account));
        SetOpenWalletListState(false);
        SetWalletButtonShow(true);
        location.reload();
      }
    } catch (err: any) {
      if (err?.code === 4001) {
        setMetaMaskError('MetaMask connection was rejected. Please try again.');
      } else {
        setMetaMaskError(err?.message || 'MetaMask connection failed.');
      }
    }
  }

  async function loginSubstrate() {
    if (!window) return;
    const { isWeb3Injected, web3Enable } = await import('@polkadot/extension-dapp');
    await web3Enable('my cool dapp');
    if (isWeb3Injected) {
      const { web3Accounts } = await import('@polkadot/extension-dapp');
      const allAccounts = await web3Accounts();
      SetSubstrateAddressList(allAccounts);
      SetOpenWalletListState(false);
      SetOpenSubstrateAddress(true);
    } else {
      setInstallSubstrate(true);
    }
  }

  const loginAccount = () => {
    if (selectedSubstrateAddress) {
      SetAccountChooseValue(2);
      SetIntactWalletAddress(selectedSubstrateAddress);
      SetOpenSubstrateAddress(false);
      SetWalletButtonShow(true);
      setWalletAddress(address_slice(selectedSubstrateAddress));
      location.reload();
    }
  };

  const close_wallet_list = () => SetOpenWalletListState(false);
  const metamask_install = () => { setInstallMetaMask(false); setMetaMaskError(''); };
  const substrate_wallet_install = () => setInstallSubstrate(false);
  const rechoose_substrate_address = () => SetOpenSubstrateAddress(false);

  return (
    <>
      {/* Wallet selection dialog */}
      <Transition.Root show={OpenWalletListState} as={Fragment}>
        <Dialog as="div" className="fixed z-20 inset-0 overflow-y-auto" onClose={close_wallet_list}>
          <div className="flex items-center justify-center min-h-screen px-4 pb-20 text-center sm:block -mt-10">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block align-bottom p-0.5 rounded-lg bg-gradient-to-br from-W3G1 via-W3G2 to-W3G3 text-left overflow-hidden shadow-xl transform transition-all sm:align-middle">
                <div className="bg-black px-4 py-5 sm:px-6 lg:px-12 rounded-md sm:p-6 lg:p-12">
                  <div className="flex justify-between text-xl font-light">
                    <div className="font-bold mb-2 text-2xl text-white">Connect your wallet</div>
                    <button onClick={close_wallet_list} className="fa fa-times text-white text-2xl" aria-hidden="true" />
                  </div>
                  <div className="text-base text-gray-300 lg:w-96 mr-8">
                    Connect with one of available wallet providers or create a new wallet.
                  </div>

                  {metaMaskError && (
                    <div className="mt-4 p-3 rounded-lg bg-red-900/30 border border-red-700/60 text-red-300 text-sm">
                      {metaMaskError}
                    </div>
                  )}

                  <button onClick={loginMetaMask} className="bg-neutral-700 text-white flex justify-between p-4 rounded-lg w-full my-8">
                    <div className="text-lg font-semibold">MetaMask</div>
                    <div>
                      <img className="w-8 h-8" src="https://portal.web3games.org/icon-wallet-metamask.svg" alt="" />
                    </div>
                  </button>

                  <button className="bg-neutral-700 flex justify-between text-white p-4 rounded-lg w-full my-8">
                    <div className="text-lg font-semibold">WalletConnect</div>
                    <div>
                      <img className="w-8 h-8" src="https://portal.web3games.org/icon-wallet-walletconnect.svg" alt="" />
                    </div>
                  </button>

                  <button onClick={loginSubstrate} className="bg-neutral-600 flex justify-between text-white p-4 rounded-lg w-full my-8">
                    <div className="text-lg font-semibold">Polkadotjs</div>
                    <div>
                      <img className="w-8 h-8 rounded-lg" src="https://cdn.discordapp.com/attachments/876498266550853642/908665467273613392/unknown.png" alt="" />
                    </div>
                  </button>

                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-neutral-700" />
                    <span className="text-xs text-gray-500">or</span>
                    <div className="flex-1 h-px bg-neutral-700" />
                  </div>

                  <button
                    onClick={() => { SetOpenWalletListState(false); setOpenAuthModal(true); }}
                    className="bg-neutral-800 border border-neutral-600 hover:border-neutral-400 flex justify-between text-white p-4 rounded-lg w-full transition-colors"
                  >
                    <div className="text-lg font-semibold">Email &amp; Password</div>
                    <div className="flex items-center">
                      <i className="fa fa-envelope text-gray-300 text-xl" aria-hidden="true" />
                    </div>
                  </button>

                  <div className="text-sm text-gray-500 lg:w-96 mt-8">
                    We do not own your private keys and cannot access your funds without your confirmation.
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Substrate address selection */}
      <Transition.Root show={openSubstrateAddress} as={Fragment}>
        <Dialog as="div" className="fixed z-20 inset-0 overflow-y-auto" onClose={rechoose_substrate_address}>
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
              <div className="inline-block align-bottom p-0.5 rounded-lg bg-gradient-to-br from-W3G1 via-W3G2 to-W3G3 text-left overflow-hidden shadow-xl transform transition-all sm:align-middle">
                <div className="bg-black px-4 py-5 sm:px-6 lg:px-12 rounded-md sm:p-6">
                  <div className="flex justify-end text-xl">
                    <button onClick={rechoose_substrate_address} className="fa fa-times" aria-hidden="true" />
                  </div>
                  <div className="text-center text-white font-bold mb-5 w-80 md:w-96">Choose Account</div>

                  {SubstrateAddressList.map((item: any) => (
                    <div key={item.address} className="flex justify-between px-5 py-3 border-t items-center">
                      <label htmlFor={item.address} className="font-medium text-white">
                        {item.meta.name}
                      </label>
                      <input
                        id={item.address}
                        name="substrate-address"
                        type="radio"
                        value={item.address}
                        checked={selectedSubstrateAddress === item.address}
                        onChange={e => setSelectedSubstrateAddress(e.target.value)}
                        className="accent-[#8E6CCD] h-4 w-4 text-white border-gray-300 rounded"
                      />
                    </div>
                  ))}

                  <div className="mt-5 sm:mt-6 flex justify-center">
                    <button
                      onClick={loginAccount}
                      disabled={!selectedSubstrateAddress}
                      type="button"
                      className="inline-flex justify-center rounded-md shadow-sm px-10 py-2 bg-gradient-to-r from-W3G1 via-W3G2 to-W3G3 text-base font-medium text-white sm:text-sm disabled:opacity-50"
                    >
                      Login
                    </button>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Substrate not installed */}
      <Transition.Root show={InstallSubstrate} as={Fragment}>
        <Dialog as="div" className="fixed z-20 inset-0 overflow-y-auto" onClose={substrate_wallet_install}>
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 text-center sm:block sm:p-0">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:align-middle sm:p-6">
                <div className="flex justify-end text-xl">
                  <button onClick={substrate_wallet_install} className="fa fa-times" aria-hidden="true" />
                </div>
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-2">
                  <ExclamationIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="text-center font-bold px-40">Connection Failed</div>
                <div className="mt-3 px-5 sm:mt-5 border-t">
                  <div className="flex my-3 justify-center">
                    Download Polkadot[js] Extension <a className="text-blue-400 ml-0.5" href="https://polkadot.js.org/extension/">here</a>.
                  </div>
                  <Dialog.Title as="h3" className="mt-3 text-center text-lg leading-6 font-medium text-gray-900">
                    <button onClick={loginSubstrate}>
                      <div className="flex justify-center">
                        <img className="w-10 h-10" src="/substrate.svg" alt="" />
                        <h1 className="ml-2 mt-2">Try Again</h1>
                        <div className="text-center mt-1.5 text-xl"><i className="ml-10 fa fa-arrow-right" aria-hidden="true" /></div>
                      </div>
                    </button>
                  </Dialog.Title>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* MetaMask not installed */}
      <Transition.Root show={InstallMetaMask} as={Fragment}>
        <Dialog as="div" className="fixed z-20 inset-0 overflow-y-auto" onClose={metamask_install}>
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 text-center sm:block sm:p-0">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:align-middle sm:p-6">
                <div className="flex justify-end text-xl">
                  <button onClick={metamask_install} className="fa fa-times" aria-hidden="true" />
                </div>
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-2">
                  <ExclamationIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="text-center font-bold px-40">Connection Failed</div>
                <div className="mt-3 px-5 sm:mt-5 border-t">
                  <div className="flex my-3 justify-center">
                    Download MetaMask Extension <a className="text-blue-400 ml-0.5" href="https://metamask.io/download/">here</a>.
                  </div>
                  <Dialog.Title as="h3" className="mt-3 text-center text-lg leading-6 font-medium text-gray-900">
                    <button onClick={loginMetaMask}>
                      <div className="flex justify-center">
                        <img className="w-10 h-10" src="https://portal.web3games.org/icon-wallet-metamask.svg" alt="" />
                        <h1 className="ml-2 mt-2">Try Again</h1>
                        <div className="text-center mt-1.5 text-xl"><i className="ml-10 fa fa-arrow-right" aria-hidden="true" /></div>
                      </div>
                    </button>
                  </Dialog.Title>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <AuthModal
        isOpen={openAuthModal}
        onClose={() => setOpenAuthModal(false)}
        onSuccess={(user) => {
          SetIsEmailAuthenticated(true);
          setWalletAddress(user?.email || 'Email User');
          SetIntactWalletAddress(user?.email || '');
          SetWalletButtonShow(true);
        }}
      />
    </>
  );
};

export default Login;
