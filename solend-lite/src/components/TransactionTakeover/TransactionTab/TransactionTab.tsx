import { Flex } from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, Transaction, TransactionSignature } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { ResultConfigType } from 'components/Result/Result';
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { ObligationType, selectedObligationAtom } from 'stores/obligations';
import { SelectedReserveType } from 'stores/pools';
import { publicKeyAtom } from 'stores/wallet';
import { titleCase, U64_MAX } from '@solendprotocol/solend-sdk';
import BigInput from '../BigInput/BigInput';
import ConfirmButton from '../ConfirmButton/ConfirmButton';
import ReserveStats from '../ReserveStats/ReserveStats';
import { connectionAtom } from 'stores/settings';

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
  onSubmit: (
    value: string,
    publicKey: string,
    selectedReserve: SelectedReserveType,
    connection: Connection,
    sendTransaction: (
      txn: Transaction,
      connection: Connection,
    ) => Promise<TransactionSignature>,
  ) => Promise<string | undefined>;
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
  const { sendTransaction } = useWallet();
  const [publicKey] = useAtom(publicKeyAtom);
  const [connection] = useAtom(connectionAtom);
  const [selectedObligation] = useAtom(selectedObligationAtom);

  const makeTransaction = useCallback(
    (newValue: string) => {
      if (publicKey && selectedReserve) {
        const useMax = new BigNumber(newValue).isEqualTo(maxValue);

        return onSubmit(
          ((action === 'borrow' || action === 'withdraw') && useMax) ||
            (action === 'repay' &&
              selectedObligation?.borrows
                ?.find((b) => b.reserveAddress === selectedReserve.address)
                ?.amount.toString() === newValue)
            ? U64_MAX
            : new BigNumber(newValue)
                .shiftedBy(selectedReserve.decimals)
                .toFixed(0, BigNumber.ROUND_FLOOR),
          publicKey,
          selectedReserve,
          connection,
          (txn) => sendTransaction(txn, connection, { skipPreflight: true }),
        );
      }
    },
    [
      selectedObligation?.borrows,
      action,
      maxValue,
      onSubmit,
      publicKey,
      selectedReserve,
      connection,
      sendTransaction,
    ],
  );

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
        onClick={() => makeTransaction(value)}
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
