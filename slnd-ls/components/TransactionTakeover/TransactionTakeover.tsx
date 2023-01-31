import { 
    Button, 
    Input, 
    Modal, 
    ModalBody, 
    ModalCloseButton, 
    ModalContent, 
    ModalOverlay, 
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel
} from "@chakra-ui/react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useAtom, } from "jotai";
import { useCallback } from "react";
import { useState } from "react";
import { connectionAtom, ReserveType, SelectedReserveType } from 'stores/pools';
import { publicKeyAtom } from "stores/wallet";
import { supplyConfigs } from "./configs"
import { SolendAction } from './../../../solend-sdk/src/classes/action';
import TransactionTab from "./TransactionTab/TransactionTab";
import BigNumber from "bignumber.js";

export default function TransactionTakeover({
    selectedReserve,
    onClose
}:{
    selectedReserve: SelectedReserveType | null,
    onClose: () => void,
}) {
    const [value, setValue] = useState('10');

    return <Modal isOpen={Boolean(selectedReserve)} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
        <Tabs>
  <TabList>
    <Tab>Supply</Tab>
    <Tab>Borrow</Tab>
    <Tab>Withdraw</Tab>
    <Tab>Repay</Tab>
  </TabList>

  <TabPanels>
    <TabPanel>
      <TransactionTab
        value={value}
        setValue={setValue}
        onSubmit={supplyConfigs.action}
        onClose={onClose}
        selectedReserve={selectedReserve!}
        maxValue={new BigNumber('10000000000')}
        // maxValue={supplyConfigs.calculateMax()}
      />
    </TabPanel>
    <TabPanel>
    {/* <TransactionTab/> */}
    </TabPanel>
    <TabPanel>
    {/* <TransactionTab/> */}
    </TabPanel>
    <TabPanel>
    {/* <TransactionTab/> */}
    </TabPanel>
  </TabPanels>
</Tabs>
        </ModalContent>
    </Modal>
}