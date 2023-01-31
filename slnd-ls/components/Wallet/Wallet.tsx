import { Text, List, ListItem, Input, Button, Center, Table, TableContainer, Tbody, Td, Th, Thead, Tr  } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";
import { metadataAtom } from "stores/metadata";
import { selectedObligationAtom } from "stores/obligations";
import { configAtom, selectedPoolAtom } from 'stores/pools';
import { setPublicKeyAtom, walletAssetsAtom } from "stores/wallet";
import { formatToken } from "utils/numberFormatter";

export default function Wallet() {
    const [ config ] = useAtom(configAtom);
    const [ walletAssets ] = useAtom(walletAssetsAtom);
    const [ selectedPool ] = useAtom(selectedPoolAtom);
    const {publicKey} = useWallet();
    const setPublicKeyInAtom = useSetAtom(setPublicKeyAtom);

    useEffect(() => {
        setPublicKeyInAtom(publicKey?.toBase58() ?? null)
    }, [publicKey?.toBase58(), config.map(c => c.address).join(',')])

    const walletContents = walletAssets.filter(asset => selectedPool?.reserves.map(reserve => reserve.mintAddress).includes(asset.mintAddress));

    return <TableContainer>
      <Table>
        <Thead>
          <Tr>
            <Th><Text>Wallet asset</Text></Th>
            <Th><Text>Balance</Text></Th>
          </Tr>
        </Thead>
        <Tbody>
          {walletContents.map(mint => <Tr key={mint.mintAddress}>
            <Td><Text>{mint.symbol ?? `${mint.mintAddress.slice(0,4)}...${mint.mintAddress.slice(-4,mint.mintAddress.length-1)}`} ({selectedPool?.reserves.find(r => r.mintAddress === mint.mintAddress)?.price?.toString()})</Text></Td>
            <Td isNumeric><Text>{formatToken(mint.amount.toString())} {mint.symbol}</Text></Td>
          </Tr>)}
        </Tbody>
      </Table>
    </TableContainer>
}