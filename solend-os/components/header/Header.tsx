import { Flex } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAtom } from "jotai";
import dynamic from "next/dynamic";
import { poolsAtom } from 'stores/pools';

const WalletDisconnectButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletDisconnectButton,
    { ssr: false }
);
const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

export function Header() {
    const [pools] = useAtom(poolsAtom);
    const { publicKey } = useWallet();

    return <Flex>
            {publicKey ? <WalletDisconnectButtonDynamic /> : <WalletMultiButtonDynamic />}
        Total number of pools: {pools.reduce((acc, pool) => pool.reserves.length + acc, 0)}
    </Flex>
}