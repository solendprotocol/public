import { FC, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import AssetInput from "./AssetInput";
import { BNumber, BZero, max, min } from "utils/utils";
import ConfirmButton from "./ConfirmButton";
import MoreParams from "./MoreParams";
type WithdrawPropsType = {
  selectedToken: any;
  onFinish: () => void;
};

const Withdraw: FC = ({ selectedToken, onFinish }: WithdrawPropsType) => {
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState();
  const [value, setValue] = useState<string | null>(null);
  const [showFees, setShowFees] = useState<boolean>(true);
  const [showRewards, setShowRewards] = useState<boolean>(false);
  const [showPositions, setShowPositions] = useState<boolean>(false);

  const valueObj = value ? new BNumber(value) : null;

  const onValueChange = (val: string | null) => {
    setShowPositions(true);
    setValue(val);
  };
  //TODO:get mac value, remove dummy data
  const maxValue = BZero;

  const [disableConfirmButton, buttonText] = ((): [boolean, string] => {
    if (!publicKey) {
      return [false, "Connect wallet"];
    }
    return [false, "Enter a value"];
  })();

  const onClick = async (val: string) => {};
  return (
    <div className="flex flex-col ">
      <AssetInput
        selectedToken={selectedToken}
        onChange={onValueChange}
        value={value}
        maxPossibleValue={max(BZero, maxValue).toString()}
      />
      <div className="flex flex-col gap-2 py-4">
        <span className="flex justify-between">
          <h3 className="text-neutral-content text-sm">User borrow limit</h3>
          <h3 className="text-primary-content text-sm">$0.00</h3>
        </span>
        <span className="flex justify-between">
          <h3 className="text-neutral-content text-sm">Utilization</h3>
          <h3 className="text-primary-content text-sm">0%</h3>
        </span>
        <span className="flex justify-between">
          <h3 className="text-neutral-content text-sm">Supply APR</h3>
          <h3 className="text-primary-content text-sm">1.46%</h3>
        </span>
      </div>
      <MoreParams />
      <ConfirmButton
        needsConnect={!publicKey}
        value={value}
        onFinish={onFinish}
        finishText={buttonText}
        action="supplied"
        onClick={onClick}
        disabled={disableConfirmButton}
        symbol={selectedToken.symbol}
      />

      <span className="flex justify-between py-4">
        <h3 className="text-neutral-content text-sm">1 SOL in wallet</h3>
        <h3 className="text-neutral-content text-sm">1 SOL supplied</h3>
      </span>
    </div>
  );
};
export default Withdraw;
