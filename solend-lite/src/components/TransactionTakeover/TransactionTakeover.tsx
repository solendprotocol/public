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
  useMediaQuery,
  Drawer,
  DrawerOverlay,
  DrawerContent,
} from '@chakra-ui/react';
import { useAtom, useSetAtom } from 'jotai';
import { useState } from 'react';
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
import BigNumber from 'bignumber.js';
import { refreshPageAtom } from 'stores/settings';
import { selectedReserveAtom } from 'stores/pools';

export default function TransactionTakeover() {
  const [obligation] = useAtom(selectedObligationAtom);
  const [walletAssets] = useAtom(walletAssetsAtom);
  const [tabIndex, setTabIndex] = useState(0);
  const refresh = useSetAtom(refreshPageAtom);
  const [selectedReserve, setSelectedReserve] = useAtom(selectedReserveAtom);
  const [value, setValue] = useState('');
  const [result, setResult] = useState<ResultConfigType | null>(null);
  const [isLargerThan800] = useMediaQuery('(min-width: 800px)');

  const handleTabsChange = (index) => {
    setTabIndex(index);
  };

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
  };

  const content = result ? (
    <Result result={result} setResult={setResult} />
  ) : (
    <Tabs
      index={tabIndex}
      onChange={(index) => {
        setValue('');
        handleTabsChange(index);
      }}
    >
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
            maxValue={supplyConfigs.calculateMax(selectedReserve, walletAssets)}
            action='supply'
            invalidMessage={supplyConfigs.verifyAction(
              new BigNumber(value),
              obligation,
              selectedReserve,
              walletAssets,
            )}
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
            invalidMessage={borrowConfigs.verifyAction(
              new BigNumber(value),
              obligation,
              selectedReserve,
              walletAssets,
            )}
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
            invalidMessage={withdrawConfigs.verifyAction(
              new BigNumber(value),
              obligation,
              selectedReserve,
              walletAssets,
            )}
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
            invalidMessage={repayConfigs.verifyAction(
              new BigNumber(value),
              obligation,
              selectedReserve,
              walletAssets,
            )}
            getNewCalculations={repayConfigs.getNewCalculations}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );

  return isLargerThan800 ? (
    <Modal isOpen={Boolean(selectedReserve)} onClose={() => handleCancel()}>
      <ModalOverlay />
      <ModalContent>{content}</ModalContent>
    </Modal>
  ) : (
    <Drawer
      isOpen={Boolean(selectedReserve)}
      placement='bottom'
      onClose={() => handleCancel()}
    >
      <DrawerOverlay />
      <DrawerContent>{content}</DrawerContent>
    </Drawer>
  );
}
