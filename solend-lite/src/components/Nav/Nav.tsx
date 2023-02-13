import {
  Flex,
  Input,
  List,
  ListItem,
  Center,
  Box,
  Text,
  Tooltip,
  Avatar,
} from '@chakra-ui/react';
import { useAtom } from 'jotai';
import { useState } from 'react';
import {
  configAtom,
  poolsWithMetaData,
  ReserveWithMetadataType,
  selectedPoolAtom,
} from 'stores/pools';
import { formatAddress } from 'utils/formatUtils';
import Token from 'components/Token/Token';
import { CopyIcon } from '@chakra-ui/icons';

function PoolRow({ reserves }: { reserves: Array<ReserveWithMetadataType> }) {
  const shownIcons = reserves.slice(0, 12);
  const extraIcons = reserves.slice(12);

  return (
    <Flex>
      {shownIcons
        .map((reserve) => (
          <Box key={reserve.address} mr='-6px'>
            <Token size={18} reserve={reserve} />
          </Box>
        ))
        .concat(
          extraIcons.length > 1 ? (
            <Box>
              <Tooltip label={'a'}>
                <Avatar
                  icon={
                    <Avatar
                      width='18px'
                      height='18px'
                      bg='var(--chakra-colors-brandAlt)'
                      icon={<Text fontSize={10}>+{extraIcons.length}</Text>}
                      borderRadius={100}
                    />
                  }
                  w='18px'
                  h='18px'
                  borderRadius={100}
                  border='1px solid var(--chakra-colors-neutralAlt)'
                  iconLabel={`+ ${extraIcons.length}`}
                  color='var(--chakra-colors-primary)'
                />
              </Tooltip>
            </Box>
          ) : extraIcons.length > 1 ? (
            <Token reserve={extraIcons[0]} size={18} />
          ) : (
            <Box />
          ),
        )}
    </Flex>
  );
}

export default function Nav() {
  const [newPoolAddress, setNewPoolAddress] = useState<string>('');
  const [config] = useAtom(configAtom);
  const [pools] = useAtom(poolsWithMetaData);
  const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);

  return (
    <Box position='absolute' borderRight='1px solid var(--chakra-colors-line)'>
      <Center px={2} py={3} h={50}>
        <Input
          placeholder='Enter custom address...'
          borderColor='var(--chakra-colors-line)'
          fontSize={11}
          value={newPoolAddress}
          onChange={(event) => setNewPoolAddress(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              setSelectedPool(newPoolAddress);
            }
          }}
        />
      </Center>

      <List>
        {config.map((pool) => (
          <ListItem
            key={pool.address}
            borderTop='1px'
            borderBottom='1px'
            h='64px'
            cursor='pointer'
            p={2}
            bg={
              selectedPool && pool.address === selectedPool.address
                ? 'neutralAlt'
                : undefined
            }
            onClick={() => setSelectedPool(pool.address)}
          >
            {
              <Tooltip closeOnClick label={pool.address}>
                <Box>
                  <Flex>
                    <Text>{pool.name ?? formatAddress(pool.address)} </Text>
                    <CopyIcon
                      mb='2px'
                      onClick={(e: any) => {
                        navigator.clipboard.writeText(pool.address);
                        e.stopPropagation();
                      }}
                    />
                  </Flex>
                </Box>
              </Tooltip>
            }
            <Flex>
              <PoolRow
                key={pool.address}
                reserves={pools[pool.address]?.reserves ?? []}
              />
            </Flex>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
