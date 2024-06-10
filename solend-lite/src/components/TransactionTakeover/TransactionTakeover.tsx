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
import { useMemo, useState } from 'react';
import {
  borrowConfigs,
  repayConfigs,
  supplyConfigs,
  withdrawConfigs,
} from './configs';
import TransactionTab from './TransactionTab/TransactionTab';
import { selectedObligationAtom } from 'stores/obligations';
import { publicKeyAtom, walletAssetsAtom } from 'stores/wallet';
import Result, { ResultConfigType } from 'components/Result/Result';
import BigNumber from 'bignumber.js';
import { connectionAtom, refreshPageAtom } from 'stores/settings';
import { rateLimiterAtom, selectedPoolAtom } from 'stores/pools';
import { useWallet } from '@solana/wallet-adapter-react';
import { U64_MAX } from '@solendprotocol/solend-sdk';
import { SKIP_PREFLIGHT } from 'common/config';
import { selectedModalTabAtom, selectedReserveAtom } from 'stores/modal';

export default function TransactionTakeover() {
  const { sendTransaction, signAllTransactions } = useWallet();
  const [publicKey] = useAtom(publicKeyAtom);
  const [connection] = useAtom(connectionAtom);
  const [rateLimiter] = useAtom(rateLimiterAtom);
  const [selectedObligation] = useAtom(selectedObligationAtom);
  const [walletAssets] = useAtom(walletAssetsAtom);
  const refresh = useSetAtom(refreshPageAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [selectedReserve, setSelectedReserve] = useAtom(selectedReserveAtom);
  const [selectedModalTab, setSelectedModalTab] = useAtom(selectedModalTabAtom);
  const [value, setValue] = useState('');
  const [result, setResult] = useState<ResultConfigType | null>(null);
  const [isLargerThan800] = useMediaQuery('(min-width: 800px)');

  const supplyMax = useMemo(
    () =>
      selectedReserve
        ? supplyConfigs.calculateMax(selectedReserve, walletAssets)
        : BigNumber(0),
    [selectedReserve, walletAssets],
  );
  const borrowMax = useMemo(
    () =>
      selectedReserve
        ? borrowConfigs.calculateMax(
            selectedReserve,
            walletAssets,
            selectedObligation,
            rateLimiter,
          )
        : BigNumber(0),
    [selectedReserve, walletAssets, selectedObligation, rateLimiter],
  );
  const withdrawMax = useMemo(
    () =>
      selectedReserve
        ? withdrawConfigs.calculateMax(
            selectedReserve,
            walletAssets,
            selectedObligation,
            rateLimiter,
          )
        : BigNumber(0),
    [selectedReserve, walletAssets, selectedObligation, rateLimiter],
  );
  const repayMax = useMemo(
    () =>
      selectedReserve
        ? repayConfigs.calculateMax(
            selectedReserve,
            walletAssets,
            selectedObligation,
          )
        : BigNumber(0),
    [selectedReserve, walletAssets, selectedObligation],
  );

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
      index={selectedModalTab}
      onChange={(index) => {
        setValue('');
        setSelectedModalTab(index);
      }}
      overflow={isLargerThan800 ? undefined : 'overlay'}
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
            onSubmit={() => {
              if (publicKey && selectedReserve && selectedPool) {
                return supplyConfigs.action(
                  new BigNumber(value)
                    .shiftedBy(selectedReserve.decimals)
                    .toFixed(0),
                  publicKey,
                  selectedPool,
                  selectedReserve,
                  connection,
                  sendTransaction,
                  signAllTransactions,
                  undefined,
                  undefined,
                  () => setResult({ type: 'loading' }),
                  undefined,
                  SKIP_PREFLIGHT,
                );
              }
            }}
            selectedReserve={selectedReserve}
            maxValue={supplyMax}
            action='supply'
            invalidMessage={supplyConfigs.verifyAction(
              new BigNumber(value),
              selectedObligation,
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
            onSubmit={() => {
              if (publicKey && selectedReserve && selectedPool) {
                const useMax = new BigNumber(value).isGreaterThanOrEqualTo(
                  borrowMax,
                );
                return borrowConfigs.action(
                  useMax
                    ? U64_MAX
                    : new BigNumber(value)
                        .shiftedBy(selectedReserve.decimals)
                        .toFixed(0),
                  publicKey,
                  selectedPool,
                  selectedReserve,
                  connection,
                  sendTransaction,
                  signAllTransactions,
                  undefined,
                  undefined,
                  () => setResult({ type: 'loading' }),
                  undefined,
                  SKIP_PREFLIGHT,
                );
              }
            }}
            selectedReserve={selectedReserve}
            maxValue={borrowMax}
            action='borrow'
            invalidMessage={borrowConfigs.verifyAction(
              new BigNumber(value),
              selectedObligation,
              selectedReserve,
              walletAssets,
              rateLimiter,
            )}
            getNewCalculations={borrowConfigs.getNewCalculations}
          />
        </TabPanel>
        <TabPanel>
          <TransactionTab
            onFinish={onFinish}
            value={value}
            setValue={setValue}
            onSubmit={() => {
              if (publicKey && selectedReserve && selectedPool) {
                const useMax = new BigNumber(value).isGreaterThanOrEqualTo(
                  withdrawMax,
                );

                return withdrawConfigs.action(
                  useMax
                    ? U64_MAX
                    : new BigNumber(value)
                        .shiftedBy(selectedReserve.decimals)
                        .toFixed(0),
                  publicKey,
                  selectedPool,
                  selectedReserve,
                  connection,
                  sendTransaction,
                  signAllTransactions,
                  undefined,
                  undefined,
                  () => setResult({ type: 'loading' }),
                  undefined,
                  SKIP_PREFLIGHT,
                );
              }
            }}
            selectedReserve={selectedReserve}
            maxValue={withdrawMax}
            action='withdraw'
            invalidMessage={withdrawConfigs.verifyAction(
              new BigNumber(value),
              selectedObligation,
              selectedReserve,
              walletAssets,
              rateLimiter,
            )}
            getNewCalculations={withdrawConfigs.getNewCalculations}
          />
        </TabPanel>
        <TabPanel>
          <TransactionTab
            onFinish={onFinish}
            value={value}
            setValue={setValue}
            onSubmit={() => {
              if (publicKey && selectedReserve && selectedPool) {
                const useMax = new BigNumber(value).isGreaterThanOrEqualTo(
                  repayMax,
                );

                return repayConfigs.action(
                  useMax
                    ? U64_MAX
                    : new BigNumber(value)
                        .shiftedBy(selectedReserve.decimals)
                        .toFixed(0),
                  publicKey,
                  selectedPool,
                  selectedReserve,
                  connection,
                  sendTransaction,
                  signAllTransactions,
                  undefined,
                  undefined,
                  () => setResult({ type: 'loading' }),
                  undefined,
                  SKIP_PREFLIGHT,
                );
              }
            }}
            selectedReserve={selectedReserve}
            maxValue={repayMax}
            action='repay'
            invalidMessage={repayConfigs.verifyAction(
              new BigNumber(value),
              selectedObligation,
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
      placement='top'
      onClose={() => handleCancel()}
    >
      <DrawerOverlay />
      <DrawerContent>{content}</DrawerContent>
    </Drawer>
  );
}
