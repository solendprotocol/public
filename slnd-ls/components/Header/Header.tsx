import { Flex } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAtom, useSetAtom } from "jotai";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { obligationsAtom } from "stores/obligations";
import { loadPoolsAtom, poolsAtom } from 'stores/pools';
import { publicKeyAtom } from "stores/wallet";

const WalletDisconnectButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletDisconnectButton,
    { ssr: false }
);
const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

export default function Header() {
    const [pools] = useAtom(poolsAtom);
    const [obligations] = useAtom(obligationsAtom);
    const loadPools = useSetAtom(loadPoolsAtom);
    const [publicKey] = useAtom(publicKeyAtom);

    useEffect(() => {
      if (Object.keys(pools).length > 0) {
        console.log('loaded config full');
        loadPools()
      }
    }, [Boolean(Object.keys(pools).length)])

    return <Flex>
      <>
        {publicKey ? <WalletDisconnectButtonDynamic /> : <WalletMultiButtonDynamic />}
        Wallet: {publicKey?.toBase58()}
        <br/>
        Total number of reserves: {Object.values(pools).reduce((acc, pool) => pool.reserves.length + acc, 0)}
        {' '}
        Total number of positions: {Object.values(obligations).reduce((acc, obligation) => obligation.borrows.length + obligation.deposits.length + acc, 0)}
        </>
    </Flex>
}