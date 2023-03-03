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
  InputRightElement,
  Button,
  InputGroup,
} from '@chakra-ui/react';
import { useAtom } from 'jotai';
import { lcs } from 'string-comparison';
import { createRef, RefObject, useState } from 'react';
import {
  poolsStateAtom,
  poolsWithMetaDataAtom,
  ReserveWithMetadataType,
  selectedPoolAtom,
} from 'stores/pools';
import Token from 'components/Token/Token';
import { configAtom } from 'stores/config';
import { formatAddress } from '@solendprotocol/solend-sdk';

function PoolRow({ reserves }: { reserves: Array<ReserveWithMetadataType> }) {
  const shownIcons = reserves.slice(0, 12);
  const extraIcons = reserves.slice(12);

  if (!reserves.length) return <Text mt={1} variant="label" color="secondary">-</Text>
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
  const [showCustom, setShowCustom] = useState<boolean>(false);
  const [config] = useAtom(configAtom);
  const [poolFilters, setPoolFilters] = useState<Array<string>>([]);
  const [pools] = useAtom(poolsWithMetaDataAtom);
  const [poolsState] = useAtom(poolsStateAtom);
  const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);

  const searchedFilteredPools = poolFilters.length
    ? config.filter((c) => poolFilters.includes(c.address))
    : config;
  const visiblePools = searchedFilteredPools.filter(
    (p) => poolsState === 'loading' || pools[p.address].reserves.length,
  );
  const sortedVisiblePools = visiblePools.sort((a, b) => {
    const poolA = pools[a.address];
    const poolB = pools[b.address];
    const poolADeprecated = Number(Boolean(poolA.reserves.every(r => r.disabled)));
    const poolBDeprecated = Number(Boolean(poolB.reserves.every(r => r.disabled)));

      if (poolADeprecated === poolBDeprecated) {
        return poolA.totalSupplyUsd.isGreaterThan(
          poolB.totalSupplyUsd,
        )
          ? -1
          : 1;
      }
      return (poolADeprecated > poolBDeprecated) ? 1 : -1;
  });

  const refs = sortedVisiblePools.reduce((acc, value) => {
    acc[value.address] = createRef();
    return acc;
  }, {} as { [key: string]: RefObject<any> });

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
        <Center px={2} my={2}>
          <InputGroup size='md'>
            <Input
              placeholder='Filter pools...'
              borderColor='var(--chakra-colors-line)'
              fontSize={11}
              onChange={(e) => {
                if (!e.target.value) {
                  setPoolFilters([]);
                  return;
                }

                const filteredPools = Object.values(pools).filter((market) => {
                  const keywords = [market.name?.toLowerCase() ?? ''];
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
            <InputRightElement w={16}>
              <Button
                variant='ghost'
                bg='var(--chakra-colors-neutral)'
                borderRadius='100px'
                border='1px'
                borderColor='var(--chakra-colors-line)'
                size='xs'
                px={4}
                mr={2}
                onClick={() => setShowCustom(!showCustom)}
              >
                <Text variant='caption' color='secondary'>
                  {showCustom ? 'Hide' : 'Custom'}
                </Text>
              </Button>
            </InputRightElement>
          </InputGroup>
        </Center>

        {showCustom && (
          <Center px={2} my={2}>
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
                if (refs[newPoolAddress].current) {
                  refs[newPoolAddress].current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }
              }}
            />
          </Center>
        )}
        <List>
          {sortedVisiblePools.map((pool) => (
            <ListItem
              ref={refs[pool.address]}
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
                    )?.filter((r) => !r.disabled) ?? []
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
