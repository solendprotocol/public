import { HStack, Center, Text, Spacer } from "@chakra-ui/react";
import Logo from "components/Logo/Logo";
import RpcSwitcher from "components/RpcSwitcher/RpcSwitcher";
import { useAtom, useSetAtom } from "jotai";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { obligationsAtom } from "stores/obligations";
import { loadPoolsAtom, poolsAtom } from 'stores/pools';
import { publicKeyAtom } from "stores/wallet";
import { 
  WalletDisconnectButton,
  WalletMultiButton,
  useWalletModal
 } from '@solana/wallet-adapter-react-ui';
import ConnectButton from "components/ConnectButton/ConnectButton";

export default function Header() {
    const [pools] = useAtom(poolsAtom);
    const [obligations] = useAtom(obligationsAtom);
    const loadPools = useSetAtom(loadPoolsAtom);
    const [publicKey] = useAtom(publicKeyAtom);

    useEffect(() => {
      if (Object.keys(pools).length > 0) {
        loadPools();
      }
    }, [Boolean(Object.keys(pools).length)])

    return  <HStack h="100%" spacing='48px' mx={4}><HStack>
      <Center>
      <Logo />
      </Center>
      <Center>
        <Text variant="caption">
        Wallet: {publicKey}
        <br/>
        Total number of reserves: {Object.values(pools).reduce((acc, pool) => pool.reserves.length + acc, 0)}
        {' '}
        Total number of positions: {Object.values(obligations).reduce((acc, obligation) => obligation.borrows.length + obligation.deposits.length + acc, 0)}
        </Text>
        </Center>
        </HStack>
        <Spacer/>
        <Center>
        <ConnectButton/>
        <RpcSwitcher/>
        </Center>
        </HStack>
}