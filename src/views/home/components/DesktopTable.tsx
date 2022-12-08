import { useState } from "react";
import Image from "next/image";
import {
  formatAssetPrice,
  formatAmount,
  formatPercentage,
  calculateValueinUSD,
} from "utils/formatUtils";
interface DesktopTablePropsType {
  reservesList: ReserveViewModel[] | null;
  handleSelectReserve: (reserve: ReserveViewModel) => void;
  showAPY: boolean;
}
const DesktopTable = ({
  reservesList,
  showAPY,
  handleSelectReserve,
}: DesktopTablePropsType) => {
  return (
    <table className="table w-full">
      {/* Head of the table */}
      <thead>
        <tr className="">
          <th className="text-primary-content bg-base-200">Asset Name</th>
          <th className="text-primary-content bg-base-200">LTV</th>
          <th className="text-primary-content bg-base-200">Total Supply</th>
          <th className="text-primary-content bg-base-200">
            {" "}
            Supply {showAPY ? "APY" : "APR"}
          </th>
          <th className="text-primary-content bg-base-200">Total borrow</th>
          <th className="text-primary-content bg-base-200">
            {" "}
            Borrow {showAPY ? "APY" : "APR"}
          </th>
        </tr>
      </thead>
      <tbody>
        {reservesList!.map((reserve) => (
          <tr key={reserve.address} className="cursor-pointer hover">
            <td className="bg-neutral">
              <label
                className="flex flex-row gap-4 cursor-pointer items-center"
                htmlFor="sbwr-modal"
                onClick={() => handleSelectReserve(reserve)}
              >
                <span className="w-10 h-full">
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
            <td className="bg-neutral">
              <h3>{reserve.LTV + "%"}</h3>
            </td>
            <td className="bg-neutral">
              <label
                className="flex flex-col cursor-pointer"
                htmlFor="sbwr-modal"
                onClick={() => handleSelectReserve(reserve)}
              >
                <h3 className="text-neutral-content">
                  {formatAmount(reserve.totalSupply)}
                </h3>
                <h3 className="text-neutral-content">
                  {reserve.tokenSymbol ? reserve.tokenSymbol : reserve.address}
                </h3>
                <h3 className="text-neutral-content text-sm">
                  {formatAssetPrice(
                    calculateValueinUSD(
                      reserve.totalSupply,
                      reserve.assetPriceUSD
                    ).toNumber()
                  )}
                </h3>
              </label>
            </td>

            <td className="bg-neutral">
              <h3>
                {" "}
                {formatPercentage(
                  showAPY ? reserve.supplyAPY : reserve.supplyAPR
                )}
              </h3>
            </td>
            <td className="bg-neutral">
              <label
                className="flex flex-col cursor-pointer"
                htmlFor="sbwr-modal"
                onClick={() => handleSelectReserve(reserve)}
              >
                <h3 className="text-neutral-content">
                  {formatAmount(reserve.totalBorrow)}
                </h3>
                <h3 className="text-neutral-content">
                  {reserve.tokenSymbol ? reserve.tokenSymbol : reserve.address}
                </h3>
                <h3 className="text-neutral-content text-sm">
                  {formatAssetPrice(
                    calculateValueinUSD(
                      reserve.totalBorrow,
                      reserve.assetPriceUSD
                    ).toNumber()
                  )}
                </h3>
              </label>
            </td>
            <td className="bg-neutral">
              <h3>
                {" "}
                {formatPercentage(
                  showAPY ? reserve.borrowAPY : reserve.borrowAPR
                )}
              </h3>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
export default DesktopTable;
