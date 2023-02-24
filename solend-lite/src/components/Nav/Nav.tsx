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
import { lcs } from 'string-comparison';
import { useState } from 'react';
import {
  poolsStateAtom,
  poolsWithMetaData,
  ReserveWithMetadataType,
  selectedPoolAtom,
} from 'stores/pools';
import { formatAddress } from 'utils/formatUtils';
import Token from 'components/Token/Token';
import { configAtom } from 'stores/config';

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
            <Box key='extra'>
              <Tooltip
                label={
                  <Flex p={1} gap={1}>
                    {extraIcons.map((reserve) => (
                      <Token
                        key={reserve.address}
                        reserve={reserve}
                        size={18}
                      />
                    ))}
                  </Flex>
                }
              >
                <Avatar
                  icon={
                    <Avatar
                      width='18px'
                      height='18px'
                      bg='var(--chakra-colors-line)'
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
          ) : extraIcons.length === 1 ? (
            <Token key='extra' reserve={extraIcons[0]} size={18} />
          ) : (
            <Box key='extra' />
          ),
        )}
    </Flex>
  );
}

export default function Nav({ onClose }: { onClose?: () => void }) {
  const [newPoolAddress, setNewPoolAddress] = useState<string>('');
  const [config] = useAtom(configAtom);
  const [poolFilters, setPoolFilters] = useState<Array<string>>([]);
  const [pools] = useAtom(poolsWithMetaData);
  const [poolsState] = useAtom(poolsStateAtom);
  const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);

  const searchedFilteredPools = poolFilters.length
    ? config.filter((c) => poolFilters.includes(c.address))
    : config;
  const visiblePools = searchedFilteredPools.filter(
    (p) => poolsState === 'loading' || pools[p.address].reserves.length,
  );
  const sortedVisiblePools = visiblePools.sort((a, b) => {
    return pools[a.address].totalSupplyUsd.isGreaterThan(
      pools[b.address].totalSupplyUsd,
    )
      ? -1
      : 1;
  });

  return (
    <Box
      sx={{
        '::-webkit-scrollbar': {
          width: 1,
          background: 'rgba(0, 0, 0, 0.2)',
        },
        '::-webkit-scrollbar-thumb': {
          background: 'rgba(90, 90, 90)',
        },
        '::-webkit-scrollbar-track': {
          background: 'rgba(0, 0, 0, 0.2)',
        },
      }}
      overflow='overlay'
      bg='neutral'
      position='relative'
      height='100%'
    >
      <Box
        position='absolute'
        right={0}
        left={0}
        borderRight='1px solid var(--chakra-colors-line)'
      >
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
        <Center px={2} paddingBottom={3} h={50}>
          <Input
            placeholder='Filter by name/tokens...'
            borderColor='var(--chakra-colors-line)'
            fontSize={11}
            onChange={(e) => {
              if (!e.target.value) {
                setPoolFilters([]);
                return;
              }

              const filteredPools = Object.values(pools).filter((market) => {
                const keywords = [market.name.toLowerCase()];
                market.reserves.forEach((reserve) =>
                  keywords.push(reserve.symbol.toLowerCase()),
                );
                const searchTerms = e.target.value.split(' ');
                let shouldDisplay = false;
                searchTerms.forEach((term) => {
                  const similarities = lcs.sortMatch(term, keywords);
                  for (const sim of similarities) {
                    if (sim.rating > 0.86) {
                      shouldDisplay = true;
                      return;
                    }
                  }
                  const similarities2 = lcs.sortMatch(
                    term,
                    keywords.map((x) => x.slice(0, term.length)),
                  );
                  for (const sim of similarities2) {
                    if (sim.rating > 0.86) {
                      shouldDisplay = true;
                      return;
                    }
                  }
                });

                return shouldDisplay;
              });
              setPoolFilters(filteredPools.map((p) => p.address));
            }}
          />
        </Center>
        <List>
          {sortedVisiblePools.map((pool) => (
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
              onClick={() => {
                setSelectedPool(pool.address);
                if (onClose) {
                  onClose();
                }
              }}
            >
              {
                <Tooltip
                  closeOnClick
                  label='Click to copy address to clipboard'
                >
                  <Box>
                    <Text
                      overflow='hidden'
                      textOverflow='ellipsis'
                      whiteSpace='nowrap'
                    >
                      {pool.name ?? formatAddress(pool.address)}
                    </Text>{' '}
                  </Box>
                </Tooltip>
              }
              <Flex>
                <PoolRow
                  key={pool.address}
                  reserves={
                    pools[pool.address]?.reserves.sort((r) =>
                      r.symbol ? 1 : -1,
                    ) ?? []
                  }
                />
              </Flex>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
}
