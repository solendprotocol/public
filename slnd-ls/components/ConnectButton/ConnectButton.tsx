import { Menu, MenuItem, MenuButton, Button, MenuList } from "@chakra-ui/react";
import { useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";
import { loadPoolsAtom, poolsAtom } from 'stores/pools';
import { publicKeyAtom } from "stores/wallet";
import { 
  useWalletModal
 } from '@solana/wallet-adapter-react-ui';
import { useWallet } from "@solana/wallet-adapter-react";
import { ChevronDownIcon } from "@chakra-ui/icons";

const WALLET_PREFIX_SUFFIX_LENGTH = 6;

export default function Header() {
    const [pools] = useAtom(poolsAtom);
    const { disconnect } = useWallet();
    const { visible, setVisible } = useWalletModal();
    const [publicKey] = useAtom(publicKeyAtom);

    return  publicKey ? 
    <Menu gutter={0}>
  <MenuButton as={Button} borderRight="1px solid">
  {`${publicKey.slice(
        0,
        WALLET_PREFIX_SUFFIX_LENGTH,
      )}...${publicKey.slice(-WALLET_PREFIX_SUFFIX_LENGTH)}`} <ChevronDownIcon />
  </MenuButton>
  <MenuList>
    <MenuItem onClick={() => disconnect()}>Disconnect</MenuItem>
    <MenuItem
    key='copy'
    onClick={() => {
      navigator.clipboard.writeText(publicKey);
    }}
    >Copy address</MenuItem>
  </MenuList>
</Menu>  : <Button onClick={() => setVisible(true)}>
        Connect wallet
    </Button>
}