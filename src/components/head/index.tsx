import React from "react";
import Head from 'next/head';
import Link from "next/link";
const Heads = () =>{
    return(
        <>
            <Head>
                <title>Web3Games On-Chain | Dapp</title>
                <Link passHref rel="icon" href="../web3gsmall.png" />
            </Head>
            </>
    )
}
export default Heads
