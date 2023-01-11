import { Flex } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAtom, useSetAtom } from "jotai";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { configAtom, loadPoolsAtom, poolsAtom } from 'stores/pools';

const WalletDisconnectButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletDisconnectButton,
    { ssr: false }
);
const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

export default function Header() {
    const [config] = useAtom(configAtom);
    const loadPools = useSetAtom(loadPoolsAtom);
    const [pools] = useAtom(poolsAtom);
    const { publicKey } = useWallet();

    useEffect(() => {
        if (config.length) {
          loadPools(true);
          console.log('loaded config', config);
        }
      }, [Boolean(config.length)]);
  
      useEffect(() => {
        loadPools(false)
      }, [config.join(',')])

    return <Flex>
            {publicKey ? <WalletDisconnectButtonDynamic /> : <WalletMultiButtonDynamic />}
        Total number of pools: {pools.reduce((acc, pool) => pool.reserves.length + acc, 0)}
    </Flex>
}