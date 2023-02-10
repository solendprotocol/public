import { useState } from "react";
import Image from "next/image";
import {
  formatAssetPrice,
  formatAmount,
  formatPercentage,
  calculateValueinUSD,
} from "utils/formatUtils";

interface MobileTablePropsType {
  reservesList: ReserveViewModel[] | null;
  handleSelectReserve: (reserve: ReserveViewModel) => void;
  showAPY: boolean;
}
const MobileTable = ({
  reservesList,
  showAPY,
  handleSelectReserve,
}: MobileTablePropsType) => {
  return (
    <table className="table w-full">
      <tbody>
        {reservesList!.map((reserve) => (
          <tr key={reserve.address} className="cursor-pointer hover ">
            <td className="bg-neutral w-1/5">
              <label
                className="flex flex-col gap-4 justify-center"
                htmlFor="sbwr-modal"
                onClick={() => handleSelectReserve(reserve)}
              >
                <span className="w-8 h-full">
                  <Image
                    src={
                      reserve.logoUri
                        ? reserve.logoUri
                        : "https://via.placeholder.com/150"
                    }
                    alt="Image of Reserves"
                    width="100%"
                    height="100%"
                    className="rounded object-cover"
                  />
                </span>
                <span className="flex flex-col gap-0">
                  <h3 className="">
                    {reserve.tokenSymbol
                      ? reserve.tokenSymbol
                      : reserve.address}
                  </h3>
                  <h3 className="text-neutral-content text-sm">
                    {formatAssetPrice(reserve.assetPriceUSD)}
                  </h3>
                </span>
              </label>
            </td>

            <td className="bg-neutral w-4/5">
              <label
                className="flex flex-col"
                htmlFor="sbwr-modal"
                onClick={() => handleSelectReserve(reserve)}
              >
                <span className="flex flex-row justify-between align-middle ">
                  <h3 className="text-neutral-content text-sm">LTV</h3>
                  <h3 className="">{reserve.LTV + "%"}</h3>
                </span>
                <span className="flex flex-row justify-between align-middle">
                  {" "}
                  <h3 className="text-neutral-content text-sm">
                    Total Supply
                  </h3>{" "}
                  <h3 className="text-neutral-content">
                    {formatAmount(reserve.totalSupply)}
                  </h3>
                </span>
                <span className="flex flex-row justify-between align-middle">
                  {" "}
                  <h3 className="text-neutral-content text-sm">Total Borrow</h3>
                  <h3 className="text-neutral-content">
                    {formatAmount(reserve.totalBorrow)}
                  </h3>
                </span>
                <span className="flex flex-row justify-between align-middle">
                  {" "}
                  <h3 className="text-neutral-content text-sm">
                    Supply {showAPY ? "APY" : "APR"}
                  </h3>
                  <h3 className="">
                    {formatPercentage(
                      showAPY ? reserve.supplyAPY : reserve.supplyAPR
                    )}
                  </h3>
                </span>
                <span className="flex flex-row justify-between align-middle">
                  {" "}
                  <h3 className="text-neutral-content text-sm">
                    Borrow {showAPY ? "APY" : "APR"}
                  </h3>
                  <h3 className="">
                    {formatPercentage(
                      showAPY ? reserve.borrowAPY : reserve.borrowAPR
                    )}
                  </h3>
                </span>
              </label>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
export default MobileTable;
