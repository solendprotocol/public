import {
  Modal,
  ModalContent,
  ModalOverlay,
  Tabs,
  TabList,
  Tab,
  Text,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { useAtom, useSetAtom } from 'jotai';
import { useState } from 'react';
import { configAtom, selectedReserveAtom } from 'stores/pools';
import {
  borrowConfigs,
  repayConfigs,
  supplyConfigs,
  withdrawConfigs,
} from './configs';
import TransactionTab from './TransactionTab/TransactionTab';
import { selectedObligationAtom } from 'stores/obligations';
import { walletAssetsAtom } from 'stores/wallet';
import Result, { ResultConfigType } from 'components/Result/Result';

export default function TransactionTakeover() {
  const [obligation] = useAtom(selectedObligationAtom);
  const [walletAssets] = useAtom(walletAssetsAtom);
  const refresh = useSetAtom(configAtom);
  const [selectedReserve, setSelectedReserve] = useAtom(selectedReserveAtom);
  const [value, setValue] = useState('');
  const [result, setResult] = useState<ResultConfigType | null>(null);

  if (!selectedReserve) {
    return null;
  }

  const onFinish = (res: ResultConfigType) => {
    setResult(res);
    refresh();
  };

  const handleCancel = () => {
    setValue('');
    setResult(null);
    setSelectedReserve(null);
    refresh();
  };

  return (
    <Modal isOpen={Boolean(selectedReserve)} onClose={() => handleCancel()}>
      <ModalOverlay />
      <ModalContent>
        {result ? (
          <Result result={result} setResult={setResult} />
        ) : (
          <Tabs>
            <TabList mb={2}>
              <Tab>
                <Text variant='headline'>Supply</Text>
              </Tab>
              <Tab>
                <Text variant='headline'>Borrow</Text>
              </Tab>
              <Tab>
                <Text variant='headline'>Withdraw</Text>
              </Tab>
              <Tab>
                <Text variant='headline'>Repay</Text>
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <TransactionTab
                  onFinish={onFinish}
                  value={value}
                  setValue={setValue}
                  onSubmit={(
                    submittedValue,
                    publicKey,
                    submittedSelectedReserve,
                    connection,
                    sendTransaction,
                  ) =>
                    supplyConfigs.action(
                      submittedValue,
                      publicKey,
                      submittedSelectedReserve,
                      connection,
                      sendTransaction,
                      undefined,
                      () => setResult({ type: 'loading' }),
                    )
                  }
                  selectedReserve={selectedReserve}
                  maxValue={supplyConfigs.calculateMax(
                    selectedReserve,
                    walletAssets,
                  )}
                  action='supply'
                  getNewCalculations={supplyConfigs.getNewCalculations}
                />
              </TabPanel>
              <TabPanel>
                <TransactionTab
                  onFinish={onFinish}
                  value={value}
                  setValue={setValue}
                  onSubmit={(
                    submittedValue,
                    publicKey,
                    submittedSelectedReserve,
                    connection,
                    sendTransaction,
                  ) =>
                    borrowConfigs.action(
                      submittedValue,
                      publicKey,
                      submittedSelectedReserve,
                      connection,
                      sendTransaction,
                      undefined,
                      () => setResult({ type: 'loading' }),
                    )
                  }
                  selectedReserve={selectedReserve}
                  maxValue={borrowConfigs.calculateMax(
                    selectedReserve,
                    walletAssets,
                    obligation,
                  )}
                  action='borrow'
                  getNewCalculations={borrowConfigs.getNewCalculations}
                />
              </TabPanel>
              <TabPanel>
                <TransactionTab
                  onFinish={onFinish}
                  value={value}
                  setValue={setValue}
                  onSubmit={(
                    submittedValue,
                    publicKey,
                    submittedSelectedReserve,
                    connection,
                    sendTransaction,
                  ) =>
                    withdrawConfigs.action(
                      submittedValue,
                      publicKey,
                      submittedSelectedReserve,
                      connection,
                      sendTransaction,
                      undefined,
                      () => setResult({ type: 'loading' }),
                    )
                  }
                  selectedReserve={selectedReserve}
                  maxValue={withdrawConfigs.calculateMax(
                    selectedReserve,
                    walletAssets,
                    obligation,
                  )}
                  action='withdraw'
                  getNewCalculations={withdrawConfigs.getNewCalculations}
                />
              </TabPanel>
              <TabPanel>
                <TransactionTab
                  onFinish={onFinish}
                  value={value}
                  setValue={setValue}
                  onSubmit={(
                    submittedValue,
                    publicKey,
                    submittedSelectedReserve,
                    connection,
                    sendTransaction,
                  ) =>
                    repayConfigs.action(
                      submittedValue,
                      publicKey,
                      submittedSelectedReserve,
                      connection,
                      sendTransaction,
                      undefined,
                      () => setResult({ type: 'loading' }),
                    )
                  }
                  selectedReserve={selectedReserve}
                  maxValue={repayConfigs.calculateMax(
                    selectedReserve,
                    walletAssets,
                    obligation,
                  )}
                  action='repay'
                  getNewCalculations={repayConfigs.getNewCalculations}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </ModalContent>
    </Modal>
  );
}
