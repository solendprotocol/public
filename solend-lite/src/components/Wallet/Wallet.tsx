import {
  Text,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import BigNumber from 'bignumber.js';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { configAtom } from 'stores/config';
import { selectedPoolAtom, selectedReserveAtom } from 'stores/pools';
import { setPublicKeyAtom, walletAssetsAtom } from 'stores/wallet';
import { formatToken, formatUsd } from 'utils/numberFormatter';

export default function Wallet() {
  const [config] = useAtom(configAtom);
  const [walletAssets] = useAtom(walletAssetsAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const { publicKey } = useWallet();
  const setPublicKeyInAtom = useSetAtom(setPublicKeyAtom);
  const setSelectedReserve = useSetAtom(selectedReserveAtom);

  const uniqueConfigHash = config.map((c) => c.address).join(',');
  const pubString = publicKey?.toBase58();
  useEffect(() => {
    setPublicKeyInAtom(pubString ?? null);
  }, [pubString, uniqueConfigHash, setPublicKeyInAtom]);

  const walletContents = walletAssets.filter(
    (asset) =>
      selectedPool?.reserves
        .map((reserve) => reserve.mintAddress)
        .includes(asset.mintAddress) && !asset.amount.isZero(),
  );

  return (
    <TableContainer>
      <Table size='sm'>
        <Thead>
          <Tr>
            <Th w={200}>
              <Text color='secondary' variant='caption'>
                Wallet asset
              </Text>
            </Th>
            <Th>
              <Text color='secondary' variant='caption' textAlign='right'>
                Balance
              </Text>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {walletContents.map((mint) => {
            const price =
              selectedPool?.reserves.find(
                (r) => r.mintAddress === mint.mintAddress,
              )?.price ?? new BigNumber(0);
            return (
              <Tr
                key={mint.mintAddress}
                onClick={() =>
                  setSelectedReserve(
                    selectedPool?.reserves?.find(
                      (r) => r.mintAddress === mint.mintAddress,
                    )?.address ?? null,
                  )
                }
                cursor='pointer'
              >
                <Td>
                  <Text>
                    {mint.symbol ??
                      `${mint.mintAddress.slice(
                        0,
                        4,
                      )}...${mint.mintAddress.slice(
                        -4,
                        mint.mintAddress.length - 1,
                      )}`}
                  </Text>
                  <Text color='secondary' variant='label'>
                    {formatUsd(price)}
                  </Text>
                </Td>
                <Td isNumeric>
                  <Text>
                    {formatToken(mint.amount.toString())} {mint.symbol}
                  </Text>
                  <Text color='secondary' variant='label'>
                    {formatUsd(price.times(mint.amount))}
                  </Text>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
