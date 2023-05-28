import { Flex, Text } from '@chakra-ui/react';
import BigNumber from 'bignumber.js';
import { ResultConfigType } from 'components/Result/Result';
import { useAtom } from 'jotai';
import { ObligationType, selectedObligationAtom } from 'stores/obligations';
import { SelectedReserveType } from 'stores/pools';
import { publicKeyAtom, walletAssetsAtom } from 'stores/wallet';
import { titleCase } from '@solendprotocol/solend-sdk';
import BigInput from '../BigInput/BigInput';
import ConfirmButton from '../ConfirmButton/ConfirmButton';
import ReserveStats from '../ReserveStats/ReserveStats';
import { formatToken } from 'utils/numberFormatter';

export default function TransactionTab({
  onFinish,
  value,
  setValue,
  onSubmit,
  selectedReserve,
  maxValue,
  action,
  invalidMessage,
  getNewCalculations,
}: {
  onFinish: (res: ResultConfigType) => void;
  value: string;
  setValue: (arg: string) => void;
  onSubmit: () => Promise<string> | undefined;
  selectedReserve: SelectedReserveType;
  maxValue: BigNumber;
  action: 'supply' | 'borrow' | 'withdraw' | 'repay';
  invalidMessage: string | null;
  getNewCalculations: (
    obligation: ObligationType | null,
    reserve: SelectedReserveType,
    value: string,
  ) => {
    borrowLimit: BigNumber | null;
    newBorrowLimit: BigNumber | null;
    utilization: BigNumber | null;
    newBorrowUtilization: BigNumber | null;
    calculatedBorrowFee: BigNumber | null;
  };
}) {
  const [publicKey] = useAtom(publicKeyAtom);
  const [selectedObligation] = useAtom(selectedObligationAtom);
  const [walletAssets] = useAtom(walletAssetsAtom);
  const stats = getNewCalculations(selectedObligation, selectedReserve, value);

  const borrowRepay = ['borrow', 'repay'].includes(action);
  const balance = borrowRepay
    ? selectedObligation?.borrows.find(
        (b) => b.reserveAddress === selectedReserve.address,
      )?.amount
    : selectedObligation?.deposits.find(
        (d) => d.reserveAddress === selectedReserve.address,
      )?.amount;
  const valueObj = new BigNumber(value);
  const buttonText =
    !valueObj.isZero() && !valueObj.isNaN()
      ? invalidMessage ??
        `${titleCase(action)} ${new BigNumber(value).toFormat()} ${
          selectedReserve.symbol
        }`
      : 'Enter an amount';

  const walletBalance = walletAssets.find(
    (a) => a.mintAddress === selectedReserve.mintAddress,
  )?.amount;

  return (
    <Flex direction='column'>
      <BigInput
        selectedToken={selectedReserve}
        onChange={setValue}
        value={value}
        maxPossibleValue={maxValue}
      />
      <ReserveStats reserve={selectedReserve} action={action} {...stats} />
      <ConfirmButton
        onClick={() => onSubmit()}
        needsConnect={!publicKey}
        value={value}
        onFinish={onFinish}
        finishText={publicKey ? buttonText : 'Connect your wallet'}
        action={action}
        disabled={Boolean(invalidMessage) || valueObj.isZero()}
        symbol={selectedReserve.symbol}
      />
      <Flex justify='space-between' mt='24px' mb='-16px'>
        <Text color='secondary'>
          {walletBalance ? formatToken(walletBalance, 4, true) : '-'}{' '}
          {selectedReserve.symbol} in wallet
        </Text>
        <Text color='secondary'>
          {balance ? formatToken(balance, 4, true) : 0} {selectedReserve.symbol}{' '}
          {borrowRepay ? 'borrowed' : 'supplied'}
        </Text>
      </Flex>
    </Flex>
  );
}
