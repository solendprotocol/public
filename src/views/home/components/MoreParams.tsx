import { useState } from "react";
import Link from "next/link";
import { ReactSVG } from "react-svg";
const MoreParams = ({}) => {
  const [moreActive, setMoreActive] = useState(false);
  return (
    <div className="flex flex-col w-full">
      <span className="divider border-primary-content flex gap-2 cursor-pointer">
        <small className="" onClick={() => setMoreActive(!moreActive)}>
          More Parameters
        </small>{" "}
        {moreActive ? (
          <ReactSVG wrapper="span" src={"/icons/caretup.svg"} />
        ) : (
          <ReactSVG wrapper="span" src={"/icons/caretdown.svg"} />
        )}
      </span>
      {moreActive && (
        <div className="flex flex-col gap-2 pb-4">
          <div className="flex flex-row justify-between">
            <span className="flex gap-1 align-middle items-center">
              <h4 className="text-neutral-content text-sm">
                Liquidation threshold{" "}
              </h4>
              <div
                className="tooltip tooltip-top"
                data-tip="Liquidation threshold is the limit where your collateral will be eligible for liquidation. This is marked by the red bar. Lower your borrow utilization to minimize this risk.

                  Each asset supplied increases your borrow limit by a percentage of its value.
                  
                  (Currently 0% of supply balance)"
              >
                <ReactSVG wrapper="span" src="/icons/info.svg" />
              </div>
            </span>

            <h3 className="text-sm">$0.00</h3>
          </div>
        </div>
      )}
    </div>
  );
};
export default MoreParams;
