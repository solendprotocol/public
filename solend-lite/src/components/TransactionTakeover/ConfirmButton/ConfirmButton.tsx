import React, { ReactElement, useState } from 'react';
import { Button } from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { ResultConfigType } from 'components/Result/Result';

interface ConfirmButtonPropsType {
  value: string | null;
  onFinish: (res: ResultConfigType) => void;
  finishText: string;
  action: string;
  disabled?: boolean;
  needsConnect?: boolean;
  onClick: () => Promise<string[] | undefined> | undefined;
  canShowCanceled?: boolean;
  symbol: string;
}

ConfirmButton.defaultProps = {
  disabled: false,
  canShowCanceled: true,
  needsConnect: false,
};

function ConfirmButton({
  value,
  onFinish,
  finishText,
  action,
  disabled,
  needsConnect,
  onClick,
  canShowCanceled,
  symbol,
}: ConfirmButtonPropsType): ReactElement {
  const { connect } = useWallet();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  return (
    <Button
      size='md'
      disabled={!needsConnect && (disabled || showConfirm || !value)}
      onClick={async () => {
        if (needsConnect) {
          connect();
        } else {
          if (showCancelled) {
            setShowCancelled(false);
          }
          if (value) {
            setShowConfirm(true);
            let signatures;
            try {
              signatures = await onClick();
            } catch (e: any) {
              console.error(e);
              onFinish({
                type: 'error',
                message: String(e.message ?? e),
              });
            }
            if (!signatures) {
              setShowConfirm(false);
              setShowCancelled(true);
            } else {
              setShowConfirm(false);
              setShowCancelled(false);
              onFinish({
                type: 'success',
                symbol,
                action,
                amountString: value,
                signatures,
              });
            }
          }
        }
      }}
    >
      {/* TODO: express as if statement block */}
      {/* eslint-disable-next-line no-nested-ternary */}
      {showConfirm
        ? 'Confirm transaction in wallet'
        : showCancelled && canShowCanceled
        ? 'Cancelled transaction'
        : finishText}
    </Button>
  );
}

export default ConfirmButton;
