import { useState } from "react";
import { ReactSVG } from "react-svg";
const PoolPositionModal = () => {
  const [walletBalancesActive, setWalletBalancesActive] = useState(false);
  const assetsBorrowed = [{}, {}, {}, {}, {}];
  const assetsBorrowedItems = assetsBorrowed!.map((p, x) => (
    <div className="flex flex-col" key={x}>
      <span className="flex justify-between">
        <h3 className=" ">Solana</h3>
        <h3 className="">144,212 SOL</h3>
      </span>
      <span className="flex justify-between">
        <h3 className="text-neutral-content text-sm">$314</h3>
        <h3 className="text-neutral-content text-sm">$382,3334</h3>
      </span>
    </div>
  ));

  const assetsSupplied = [{}, {}, {}, {}, {}];

  const assetsSuppliedItems = assetsSupplied!.map((p, x) => (
    <div className="flex flex-col" key={x}>
      <span className="flex justify-between">
        <h3 className=" ">Solana</h3>
        <h3 className="">144,212 SOL</h3>
      </span>
      <span className="flex justify-between">
        <h3 className="text-neutral-content text-sm">$314</h3>
        <h3 className="text-neutral-content text-sm">$382,3334</h3>
      </span>
    </div>
  ));

  const walletBalance = [{}, {}, {}, {}, {}];
  const walletBalanceItems = walletBalance!.map((p, x) => (
    <div className="flex flex-col" key={x}>
      <span className="flex justify-between">
        <h3 className=" ">Solana</h3>
        <h3 className="">144,212 SOL</h3>
      </span>
      <span className="flex justify-between">
        <h3 className="text-neutral-content text-sm">$314</h3>
        <h3 className="text-neutral-content text-sm">$382,3334</h3>
      </span>
    </div>
  ));
  return (
    <>
      <input type="checkbox" id="pp-modal" className="modal-toggle" />

      <label id="pp-modal" className="modal cursor-pointer" htmlFor="pp-modal">
        <label className="modal-box relative flex flex-col gap-2" htmlFor="">
          {/* title and close button */}
          <span className="flex justify-between">
            <span className="absolute left-4 top-4">
              <h1 className="text-xl">Pool Position</h1>
            </span>
            <label
              htmlFor="pp-modal"
              className="btn btn-sm btn-circle absolute right-4 top-4 text-primary-content"
            >
              ✕
            </label>
          </span>

          {/* pool position */}

          <div className="mt-8 rounded-lg divide-opacity-100 text-sm">
            <div className="flex flex-row justify-between px-4 pt-4">
              <span className="flex flex-col gap-0  ">
                <span className="flex gap-1 align-middle items-center">
                  <h4 className="text-neutral-content ">Net Value</h4>
                  <div
                    className="tooltip tooltip-right"
                    data-tip="The value of your account calculated as (supply balance - borrow balance)."
                  >
                    <ReactSVG wrapper="span" src="/icons/info.svg" />
                  </div>
                </span>
                <h3>$0.00</h3>
              </span>
              <span className="flex flex-col gap-0 ">
                <span className="flex gap-1 align-middle items-center">
                  <div
                    className="tooltip tooltip-left"
                    data-tip="Borrow utilization is equal to your total borrowed amount, divided by the borrow limit. At 100%, you will not be able to borrow any more and will be close to liquidation."
                  >
                    <ReactSVG wrapper="span" src="/icons/info.svg" />
                  </div>
                  <h4 className="text-neutral-content ">Borrow Utilization</h4>{" "}
                </span>
                <h3>$0.00</h3>
              </span>
            </div>
            <div className="divider h-0"></div>
            <div className="flex flex-row justify-between px-4 ">
              <span className="flex flex-col gap-0">
                <span className="flex gap-1 align-middle items-center">
                  <h4 className="text-neutral-content ">Borrow Balance</h4>
                  <div
                    className="tooltip tooltip-right"
                    data-tip="Borrow balance is the sum of all assets borrowed."
                  >
                    <ReactSVG wrapper="span" src="/icons/info.svg" />
                  </div>
                </span>
                <h3>$0.00</h3>
              </span>
              <span className="flex flex-col gap-0">
                <span className="flex gap-1 align-middle items-center">
                  <div
                    className="tooltip tooltip-left"
                    data-tip="Supply balance is the sum of all assets supplied. Increasing this value increases your borrow limit and liquidation threshold."
                  >
                    <ReactSVG wrapper="span" src="/icons/info.svg" />
                  </div>
                  <h4 className="text-neutral-content ">Supply Balance</h4>{" "}
                </span>
                <h3>$0.00</h3>
              </span>
            </div>
            <span className="px-4">
              <progress
                className="progress w-full progress-primary"
                value="60"
                max="100"
              ></progress>
            </span>
            <div className="flex flex-row justify-between px-4 pt-2">
              <span className="flex gap-1 align-middle items-center">
                <h4 className="text-neutral-content ">Borrow Limit</h4>
                <div
                  className="tooltip tooltip-right"
                  data-tip="Borrow limit is the maximum value you can borrow marked by the white bar. To increase this limit, you can supply more assets.

                  Each asset supplied increases your borrow limit by a percentage of its value.
                  
                  (Currently 0% of supply balance)."
                >
                  <ReactSVG wrapper="span" src="/icons/info.svg" />
                </div>
              </span>

              <h3>$0.00</h3>
            </div>
            <div className="flex flex-row justify-between px-4 pb-4">
              <span className="flex gap-1 align-middle items-center">
                <h4 className="text-neutral-content ">
                  Liquidation threshold{" "}
                </h4>
                <div
                  className="tooltip tooltip-right"
                  data-tip="Liquidation threshold is the limit where your collateral will be eligible for liquidation. This is marked by the red bar. Lower your borrow utilization to minimize this risk.

                  Each asset supplied increases your borrow limit by a percentage of its value.
                  
                  (Currently 0% of supply balance)"
                >
                  <ReactSVG wrapper="span" src="/icons/info.svg" />
                </div>
              </span>

              <h3>$0.00</h3>
            </div>
          </div>
          {/* balances */}
          <div className="divider h-0"></div>
          <div className="flex flex-col gap-2">
            <span className="flex justify-between">
              <h3 className="text-neutral-content text-sm">Assets supplied</h3>
              <h3 className="text-neutral-content text-sm">Balance</h3>
            </span>
            {/* Assets supplied mapping */}
            {assetsSuppliedItems}
          </div>
          <div className="divider"></div>
          <div className="flex flex-col gap-2">
            <span className="flex justify-between">
              <h3 className="text-neutral-content text-sm">Assets borrowed</h3>
              <h3 className="text-neutral-content text-sm">Balance</h3>
            </span>
            {/* Assets borrowed mapping */}
            {assetsBorrowedItems}
          </div>
          <div className="divider"></div>
          <div className="flex flex-col gap-2">
            <span className="flex justify-between">
              <span className="flex items-center gap-2 text-neutral-content cursor-pointer">
                <h3
                  className="text-neutral-content text-sm"
                  onClick={() => setWalletBalancesActive(!walletBalancesActive)}
                >
                  Wallet Balances{" "}
                </h3>{" "}
                {walletBalancesActive ? (
                  <ReactSVG wrapper="span" src={"/icons/caretup.svg"} />
                ) : (
                  <ReactSVG wrapper="span" src={"/icons/caretdown.svg"} />
                )}
              </span>

              <h3 className="text-neutral-content text-sm">Balance</h3>
            </span>
            {/* Wallet balance mapping */}
            {walletBalancesActive && walletBalanceItems}
          </div>
        </label>
      </label>
    </>
  );
};
export default PoolPositionModal;
