import { Flex } from '@chakra-ui/react';
import BigNumber from 'bignumber.js';
import { ResultConfigType } from 'components/Result/Result';
import { useAtom } from 'jotai';
import { ObligationType, selectedObligationAtom } from 'stores/obligations';
import { SelectedReserveType } from 'stores/pools';
import { publicKeyAtom } from 'stores/wallet';
import { titleCase } from '@solendprotocol/solend-sdk';
import BigInput from '../BigInput/BigInput';
import ConfirmButton from '../ConfirmButton/ConfirmButton';
import ReserveStats from '../ReserveStats/ReserveStats';

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
  const stats = getNewCalculations(selectedObligation, selectedReserve, value);

  const valueObj = new BigNumber(value);
  const buttonText =
    !valueObj.isZero() && !valueObj.isNaN()
      ? invalidMessage ??
        `${titleCase(action)} ${new BigNumber(value).toFormat()} ${
          selectedReserve.symbol
        }`
      : 'Enter an amount';

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
    </Flex>
  );
}
