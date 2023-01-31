import { 
    Button, 
    NumberInput, 
    NumberInputField,
    Flex
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, Transaction, TransactionSignature } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { useAtom } from "jotai";
import { useCallback, useState } from "react";
import { connectionAtom, ReserveType, SelectedReserveType } from "stores/pools";
import { publicKeyAtom } from "stores/wallet";
import BigInput from "../BigInput/BigInput";

export default function TransactionTab({
    value,
    setValue,
    onSubmit,
    onClose,
    selectedReserve,
    maxValue,
}:{
    value: string,
    setValue: (arg: string) => void,
    onSubmit: (
        value: string,
        publicKey: string,
        selectedReserve: SelectedReserveType,
        connection: Connection,
        sendTransaction: (
            txn: Transaction,
            connection: Connection
          ) => Promise<TransactionSignature>,
    ) => Promise<string | undefined>,
    onClose: () => void,
    selectedReserve: SelectedReserveType,
    maxValue: BigNumber,
}) {
    const { sendTransaction } = useWallet();
    const [publicKey] = useAtom(publicKeyAtom);
    const [connection] = useAtom(connectionAtom);

    const action = useCallback((value: string) => {
        if (publicKey && selectedReserve) {
        onSubmit(
            value,
            publicKey,
            selectedReserve,
            connection,
            sendTransaction
        )
        }
    }, [
        publicKey,
        selectedReserve,
        connection,
        sendTransaction,
    ])

    return <Flex>
    <BigInput 
        selectedToken={selectedReserve}
        onChange={setValue}
        value={value}
        maxPossibleValue={BigNumber.max(0, maxValue).toString()}
    />
      <Button colorScheme='blue' mr={3} onClick={() => action(value)}>
        Submit
      </Button>
      <Button variant='ghost' onClick={onClose}>Close</Button>
      </Flex>
}