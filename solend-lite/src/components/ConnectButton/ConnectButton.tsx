import {
  Menu,
  MenuItem,
  MenuButton,
  Button,
  MenuList,
  Flex,
  Text,
  useMediaQuery,
  MenuDivider,
} from '@chakra-ui/react';
import { useAtom, useSetAtom } from 'jotai';
import { publicKeyAtom } from 'stores/wallet';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  ChevronDownIcon,
  CopyIcon,
  LinkIcon,
  StarIcon,
} from '@chakra-ui/icons';
import Image from 'next/image';
import { formatAddress } from 'utils/formatUtils';
import { DEFAULT_RPC_ENDPOINTS } from 'common/config';
import { selectedRpcAtom } from 'stores/settings';
import { useState } from 'react';
import { MenuInput } from 'components/RpcSwitcher/RpcSwitcher';

export default function Header({ openAccount }: { openAccount?: () => void }) {
  const { disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [publicKey] = useAtom(publicKeyAtom);
  const setSelectedRpc = useSetAtom(selectedRpcAtom);
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [isLargerThan800] = useMediaQuery('(min-width: 800px)');

  return publicKey ? (
    <Menu gutter={0}>
      <MenuButton as={Button} borderRight='1px'>
        <Flex align='center'>
          <Image src='/wallet.svg' alt='wallet logo' width={16} height={16} />{' '}
          <Text ml={1} color='neutral'>
            {formatAddress(publicKey, isLargerThan800 ? undefined : 4)}
          </Text>{' '}
          <ChevronDownIcon />
        </Flex>
      </MenuButton>
      <MenuList>
        {[
          <MenuItem key='disconnect' onClick={() => disconnect()}>
            <LinkIcon />{' '}
            <Text pl={1} color='neutral'>
              Disconnect
            </Text>
          </MenuItem>,
          <MenuItem
            key='copy'
            onClick={() => {
              navigator.clipboard.writeText(publicKey);
            }}
          >
            <CopyIcon mr={1} />
            <Text color='neutral'>Copy address</Text>
          </MenuItem>,
        ].concat(
          ...(isLargerThan800 || !openAccount
            ? []
            : [
                <MenuDivider key='divider1' />,
                <MenuItem
                  key='account'
                  onClick={() => {
                    if (openAccount) openAccount();
                  }}
                >
                  <StarIcon mr={1} /> <Text color='neutral'>View account</Text>
                </MenuItem>,
              ]
                .concat(<MenuDivider key='divider2' />)
                .concat(
                  DEFAULT_RPC_ENDPOINTS.map((endpoint) => (
                    <MenuItem
                      key={endpoint.name}
                      onClick={() => setSelectedRpc(endpoint)}
                    >
                      <Text color='neutral'>{endpoint.name}</Text>
                    </MenuItem>
                  )),
                )
                .concat(
                  <MenuInput
                    placeholder='Enter custom RPC'
                    value={customEndpoint}
                    color='var(--chakra-colors-neutral)'
                    fontSize={11}
                    onChange={(e: any) => {
                      e.stopPropagation();
                      setCustomEndpoint(e.target.value);
                      if (customEndpoint.length) {
                        try {
                          const _test = new URL(customEndpoint);
                          setSelectedRpc({
                            name: 'Custom',
                            endpoint: customEndpoint,
                          });
                        } catch (e2) {
                          console.error(e2);
                        }
                      }
                    }}
                  />,
                )),
        )}
      </MenuList>
    </Menu>
  ) : (
    <Button onClick={() => setVisible(true)} borderRight='1px'>
      <Flex>
        <Image src='/wallet.svg' alt='wallet logo' width={16} height={16} />{' '}
        <Text ml={1} color='neutral'>
          Connect wallet
        </Text>
      </Flex>
    </Button>
  );
}
