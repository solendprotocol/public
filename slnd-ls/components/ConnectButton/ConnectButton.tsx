import {
  Menu,
  MenuItem,
  MenuButton,
  Button,
  MenuList,
  Flex,
  Text,
} from '@chakra-ui/react';
import { useAtom } from 'jotai';
import { publicKeyAtom } from 'stores/wallet';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { ChevronDownIcon, CopyIcon } from '@chakra-ui/icons';
import { shortenAddress } from 'utils/common';
import Image from 'next/image';

export default function Header() {
  const { disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [publicKey] = useAtom(publicKeyAtom);

  return publicKey ? (
    <Menu gutter={0}>
      <MenuButton
        as={Button}
        style={{
          borderRight: '1px solid',
        }}
      >
        <Flex align='center'>
          <Image src='/wallet.svg' alt='wallet logo' width={16} height={16} />{' '}
          <Text color='neutral'>{shortenAddress(publicKey)}</Text>{' '}
          <ChevronDownIcon />
        </Flex>
      </MenuButton>
      <MenuList>
        <MenuItem onClick={() => disconnect()}>
          <Text color='neutral'>Disconnect</Text>
        </MenuItem>
        <MenuItem
          key='copy'
          onClick={() => {
            navigator.clipboard.writeText(publicKey);
          }}
        >
          <CopyIcon />
          <Text color='neutral'>Copy address</Text>
        </MenuItem>
      </MenuList>
    </Menu>
  ) : (
    <Button onClick={() => setVisible(true)}>
      <Flex>
        <Image src='/wallet.svg' alt='wallet logo' width={16} height={16} />{' '}
        <Text color='neutral'>Connect wallet</Text>
      </Flex>
    </Button>
  );
}
