import type { NextPage } from 'next';
import Head from 'next/head';
import Home from "./home";
import Link from 'next/link';

const IndexPage: NextPage = () => {
  return (
    <>
      <Head >
        <title >Web3Games On-Chain | Dapp</title>
        <Link passHref rel="icon" href="/web3gsmall.png" />
      </Head>
          <Home></Home>
    </>
  )
}

export default IndexPage

