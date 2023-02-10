import React, { ReactElement, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
interface ConfirmButtonPropsType {
  value: string | null;
  onFinish: () => void;
  finishText: string;
  action: string;
  disabled?: boolean;
  needsConnect?: boolean;
  onClick: (value: string) => Promise<string | false>;
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
  const { connect, connected } = useWallet();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  return (
    <button
      className="btn btn-secondary p-2 glass text-primary-content"
      disabled={
        (!needsConnect && (disabled || showConfirm || !value)) || needsConnect
      }
      onClick={async () => {
        if (needsConnect) {
          connect();
        } else {
          if (showCancelled) {
            setShowCancelled(false);
          }
          if (value) {
            setShowConfirm(true);
            let signature;
            try {
              signature = await onClick(value);
            } catch (e: any) {
              console.error(e);
            }
            if (!signature) {
              setShowConfirm(false);
              setShowCancelled(true);
            } else {
              setShowConfirm(false);
              setShowCancelled(false);
              onFinish();
            }
          }
        }
      }}
    >
      {/* TODO: express as if statement block */}
      {/* eslint-disable-next-line no-nested-ternary */}
      {showConfirm
        ? "Confirm transaction in wallet"
        : showCancelled && canShowCanceled
        ? "Cancelled transaction"
        : finishText}
    </button>
  );
}

export default ConfirmButton;
