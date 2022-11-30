import BigNumber from "bignumber.js";
import { useReservesList } from "hooks/useReservesList";
import { useAtom } from "jotai";
import { FC, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { selectedPoolAtom } from "stores/globalStates";
import { SbwrModal, PoolPositionModal } from "views/home/components";
import {
  formatPoolValue,
  formatAssetPrice,
  formatAmount,
  formatPercentage,
  calculateValueinUSD,
} from "utils/formatUtils";
import { Error, Loader } from "components";
export const HomeView: FC = ({}) => {
  const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);
  const { reservesList, isLoading, isError } = useReservesList();
  const { connected } = useWallet();
  const [showAPY, setShowAPY] = useState(true);
  if (isError) return <Error />;
  if (isLoading) return <Loader />;

  const poolTotalSupply = reservesList!.reduce(
    (acc, curr) => acc.plus(curr.totalSupply * curr.assetPriceUSD),
    new BigNumber(0)
  );
  const poolTotalBorrow = reservesList!.reduce(
    (acc, curr) => acc.plus(curr.totalBorrow * curr.assetPriceUSD),
    new BigNumber(0)
  );
  const poolLtv = poolTotalSupply.minus(poolTotalBorrow);

  return (
    <div className="flex flex-col p-10 py-4 md:py-10 lg:py-10 h-screen gap-4">
      {/* pool title */}

      <span className="">
        {" "}
        {/* TODO: Handle null name and address, proper formatting */}
        <h1 className="text-2xl">{selectedPool.name}</h1>
      </span>
      {/* pool details starting here */}
      <div className="divider bg-base-200"></div>
      {/* for mobile devices */}
      <div className="flex flex-col gap-6 md:hidden lg:hidden">
        <div className="flex flex-row justify-between">
          {" "}
          <span className="flex flex-col gap-2">
            <h3 className="text-neutral-content">Creator</h3>
            <h3>Solend</h3> {/* TODO: Get creator name/address */}
          </span>
          <span className="flex flex-col gap-2 w-28">
            <h3 className="text-neutral-content">Total Supply</h3>
            <h3>{formatPoolValue(poolTotalSupply)}</h3>
          </span>
        </div>
        <div className="flex flex-row justify-between">
          {" "}
          <span className="flex flex-col gap-2">
            <h3 className="text-neutral-content">Total Borrow</h3>
            <h3>{formatPoolValue(poolTotalBorrow)}</h3>
          </span>
          <span className="flex flex-col gap-2 w-28">
            <h3 className="text-neutral-content">TVL</h3>
            <h3>{formatPoolValue(poolLtv)}</h3>
          </span>
        </div>

        {connected && (
          <label
            className="btn bg-base-200 cursor-pointer text-primary-content"
            htmlFor="pp-modal"
          >
            Pool Position
          </label>
        )}
      </div>

      {/* For larger devices */}
      <div className="flex-row justify-between w-full hidden md:flex lg:flex">
        {" "}
        <span className="flex flex-col gap-2">
          <h3 className="text-neutral-content">Creator</h3>
          <h3>Solend</h3> {/* TODO: Get creator name/address */}
        </span>
        <span className="flex flex-col gap-2">
          <h3 className="text-neutral-content">Total Supply</h3>
          <h3>{formatPoolValue(poolTotalSupply)}</h3>
        </span>{" "}
        <span className="flex flex-col gap-2">
          <h3 className="text-neutral-content">Total Borrow</h3>
          <h3>{formatPoolValue(poolTotalBorrow)}</h3>
        </span>
        <span className="flex flex-col gap-2">
          <h3 className="text-neutral-content">TVL</h3>
          <h3>{formatPoolValue(poolLtv)}</h3>
        </span>
        {connected && (
          <label
            className="btn bg-base-200 cursor-pointer text-primary-content"
            htmlFor="pp-modal"
          >
            Pool Position
          </label>
        )}
      </div>
      <div className="flex flex-row justify-between pt-6">
        <h2 className="text-lg">All Assets</h2>

        <span className="flex align-middle gap-2">
          <input
            type="checkbox"
            className="toggle"
            checked={showAPY}
            onChange={() => setShowAPY(!showAPY)}
          />
          <small className="text-neutral-content">
            {showAPY ? "APY" : "APR"}
          </small>
        </span>
      </div>
      <div className="divider bg-base-200"></div>

      {/* Pool assets for mobile  */}
      <div className="md:hidden lg:hidden flex">
        <table className="table w-full">
          <tbody>
            {reservesList!.map((reserve) => (
              <tr key={reserve.address} className="cursor-pointer hover">
                <td className="bg-neutral">
                  <div className="flex flex-col gap-4 justify-center">
                    <span className="w-8 h-full">
                      <img
                        src={
                          reserve.logoUri
                            ? reserve.logoUri
                            : "https://via.placeholder.com/150"
                        }
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
                  </div>
                </td>

                <td className="bg-neutral">
                  <span className="flex flex-col">
                    <span className="flex flex-row justify-between align-middle">
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
                      <h3 className="text-neutral-content text-sm">
                        Total Borrow
                      </h3>
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
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pool assets for larger */}
      <div className="md:flex lg:flex hidden">
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
                  >
                    <span className="w-10 h-full">
                      <img
                        src={
                          reserve.logoUri
                            ? reserve.logoUri
                            : "https://via.placeholder.com/150"
                        }
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
                  >
                    <h3 className="text-neutral-content">
                      {formatAmount(reserve.totalSupply)}
                    </h3>
                    <h3 className="text-neutral-content">
                      {reserve.tokenSymbol
                        ? reserve.tokenSymbol
                        : reserve.address}
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
                  >
                    <h3 className="text-neutral-content">
                      {formatAmount(reserve.totalBorrow)}
                    </h3>
                    <h3 className="text-neutral-content">
                      {reserve.tokenSymbol
                        ? reserve.tokenSymbol
                        : reserve.address}
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
      </div>
      <SbwrModal />
      <PoolPositionModal />
    </div>
  );
};
