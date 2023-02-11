import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  Button,
  useMenuItem,
  Box,
  Flex,
  Text,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { DEFAULT_RPC_ENDPOINTS } from 'utils/config';
import { selectedRpcAtom } from 'stores/settings';

const MenuInput = (props: any) => {
  const { role, ...rest } = useMenuItem(props);
  return (
    <Box px='3' role={role}>
      <Input placeholder='Enter custom RPC' size='sm' {...rest} />
    </Box>
  );
};

export default function Pool() {
  const [selectedRpc, setSelectedRpc] = useAtom(selectedRpcAtom);
  const [customEndpoint, setCustomEndpoint] = useState('');

  return (
    <Menu gutter={0}>
      <MenuButton as={Button}>
        <Flex align='center'>
          <Text color='neutral'>
            {selectedRpc.name} <ChevronDownIcon />
          </Text>
        </Flex>
      </MenuButton>
      <MenuList>
        {DEFAULT_RPC_ENDPOINTS.map((endpoint) => (
          <MenuItem
            key={endpoint.name}
            onClick={() => setSelectedRpc(endpoint)}
          >
            <Text color='neutral'>{endpoint.name}</Text>
          </MenuItem>
        ))}
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
        />
      </MenuList>
    </Menu>
  );
}
