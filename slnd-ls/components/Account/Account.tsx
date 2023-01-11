import { Flex, List, ListItem } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";
import { selectedObligationAtom } from "stores/obligations";
import { configAtom } from 'stores/pools';
import { setPublicKeyAtom, walletAssetsAtom } from "stores/wallet";

export default function Account() {
    const [ selectedObligation ] = useAtom(selectedObligationAtom);
    const [ config ] = useAtom(configAtom);
    const [ walletAssets ] = useAtom(walletAssetsAtom);
    const {publicKey} = useWallet();
    const setPublicKeyInAtom = useSetAtom(setPublicKeyAtom);

    useEffect(() => {
        if (config.length) {
            setPublicKeyInAtom(publicKey)
        }
    }, [publicKey, config.length])
    
    return <div>
        Wallet contents:
        {walletAssets.map(asset => <div>
            {asset.mintAddress.toBase58()} {asset?.amount}
        </div>)}
        Deposits: <List spacing={3}>
        {selectedObligation?.deposits.map(d => <ListItem key={d.reserveAddress.toBase58()}>
        {d.amount.toString()}
    </ListItem>)}</List>
    Borrows: <List spacing={3}>
        {selectedObligation?.borrows.map(d => <ListItem key={d.reserveAddress.toBase58()}>
        {d.amount.toString()}
    </ListItem>)}
</List>
</div>
}