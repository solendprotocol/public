import { Flex, List, ListItem } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAtom } from "jotai";
import { selectedObligationAtom } from "stores/obligations";
import { poolsAtom } from 'stores/pools';

export function Account() {
    const [ selectedObligation ] = useAtom(selectedObligationAtom);

    console.log(selectedObligation);
    return <div>Deposits: <List spacing={3}>
    {selectedObligation?.deposits.map(d => <ListItem key={d.reserveAddress.toBase58()}>
        {d.amount.toString()}
    </ListItem>)}</List>
    Borrows: <List spacing={3}>
    {selectedObligation?.deposits.map(d => <ListItem key={d.reserveAddress.toBase58()}>
        {d.amount.toString()}
    </ListItem>)}
</List></div>
}