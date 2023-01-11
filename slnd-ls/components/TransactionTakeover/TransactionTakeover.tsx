import { Button, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, NumberInput, NumberInputField } from "@chakra-ui/react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useAtom, } from "jotai";
import { useCallback } from "react";
import { useState } from "react";
import { connectionAtom, poolsFamily, ReserveType } from 'stores/pools';
import { publicKeyAtom } from "stores/wallet";
import { SolendAction } from './../../../solend-sdk/src/classes/action';

export default function TransactionTakeover({
    selectedReserve,
    onClose
}:{
    selectedReserve: ReserveType | null,
    onClose: () => void,
}) {
    const { sendTransaction } = useWallet();
    const [publicKey] = useAtom(publicKeyAtom);
    const [connection] = useAtom(connectionAtom);
    const [value, setValue] = useState('10');

    const supply = useCallback(async (value: string) => {
        debugger;
        if (value && publicKey && selectedReserve) {
            const solendAction = await SolendAction.buildDepositTxns(
                connection,
                value,
                'SOL',
                publicKey,
                "production",
                selectedReserve.poolAddress
            );

            await solendAction.sendTransactions(sendTransaction);
                onClose()
            }

    }, [publicKey, value, selectedReserve, connection])

    return <Modal isOpen={Boolean(selectedReserve)} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transaction</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
        <NumberInput 
            onChange={(value) => setValue(value)}
            value={value}
        >
            <NumberInputField />
        </NumberInput>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={() => supply(value)}>
              Submit
            </Button>
            <Button variant='ghost' onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
    </Modal>
}