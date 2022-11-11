import { useReservesList } from "hooks/useReservesList";
import Image from "next/image";
import { FC, useEffect } from "react";
import { SbwrModal } from "views/home/components";

export const HomeView: FC = ({}) => {
  const { reservesList, isLoading, isError } = useReservesList();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error!</div>;

  return (
    <div className="flex flex-col p-10 py-4 md:py-10 lg:py-10 h-screen gap-4">
      {/* pool title */}
      <span className="">
        {" "}
        <h1 className="text-2xl">Main pool</h1>
      </span>
      {/* pool details starting here */}
      <div className="divider bg-base-200"></div>
      {/* for mobile devices */}
      <div className="flex flex-col gap-6 md:hidden lg:hidden">
        <div className="flex flex-row justify-between">
          {" "}
          <span className="flex flex-col gap-2">
            <h3 className="text-neutral-content">Creator</h3>
            <h3>Solend</h3>
          </span>
          <span className="flex flex-col gap-2">
            <h3 className="text-neutral-content">Total Supply</h3>
            <h3>$279282028082</h3>
          </span>
        </div>
        <div className="flex flex-row justify-between">
          {" "}
          <span className="flex flex-col gap-2">
            <h3 className="text-neutral-content">Total Borrow</h3>
            <h3>$279282028082</h3>
          </span>
          <span className="flex flex-col gap-2">
            <h3 className="text-neutral-content">TVL</h3>
            <h3>$279282028082</h3>
          </span>
        </div>
      </div>

      {/* For larger devices */}
      {/* TODO: Get data about pool (total deposits/ borrows etc.) */}
      <div className="flex-row justify-between w-full hidden md:flex lg:flex">
        {" "}
        <span className="flex flex-col gap-2">
          <h3 className="text-neutral-content">Creator</h3>
          <h3>Solend</h3>
        </span>
        <span className="flex flex-col gap-2">
          <h3 className="text-neutral-content">Total Supply</h3>
          <h3>$279282028082</h3>
        </span>{" "}
        <span className="flex flex-col gap-2">
          <h3 className="text-neutral-content">Total Borrow</h3>
          <h3>$279282028082</h3>
        </span>
        <span className="flex flex-col gap-2">
          <h3 className="text-neutral-content">TVL</h3>
          <h3>$279282028082</h3>
        </span>
      </div>

      <div className="divider bg-base-200"></div>

      {/* Pool assets for mobile  */}
      <div className="md:hidden lg:hidden flex">
        <table className="table w-full">
          <tbody>
            {reservesList.map((reserve) => (
              <tr key={reserve.address} className="cursor-pointer hover">
                <td className="bg-neutral">
                  <div className="flex flex-col gap-4 justify-center align-middle">
                    <span className="w-4 h-full">
                      {/* TODO: get image from url */}
                      <img src="/Group.png" className="rounded object-cover" />
                    </span>
                    <span className="flex flex-col gap-0">
                      <h3 className="">
                        {reserve.name ? reserve.name : reserve.address}
                      </h3>
                      <h3 className="text-neutral-content text-sm">
                        {reserve.priceUSD}
                      </h3>
                    </span>
                  </div>
                </td>

                <td className="bg-neutral">
                  <span className="flex flex-col">
                    <span className="flex flex-row justify-between align-middle">
                      <h3 className="text-neutral-content text-sm">LTV</h3>
                      <h3 className="">{reserve.LTV}</h3>
                    </span>
                    <span className="flex flex-row justify-between align-middle">
                      {" "}
                      <h3 className="text-neutral-content text-sm">
                        Total Supply
                      </h3>{" "}
                      <h3 className="text-neutral-content">{reserve.totalSupply}</h3>
                    </span>
                    <span className="flex flex-row justify-between align-middle">
                      {" "}
                      <h3 className="text-neutral-content text-sm">
                        Total Borrow
                      </h3>
                      <h3 className="text-neutral-content">{reserve.totalBorrow}</h3>
                    </span>
                    <span className="flex flex-row justify-between align-middle">
                      {" "}
                      <h3 className="text-neutral-content text-sm">
                        Supply APY
                      </h3>
                      <h3 className="">{reserve.supplyAPY}</h3>
                    </span>
                    <span className="flex flex-row justify-between align-middle">
                      {" "}
                      <h3 className="text-neutral-content text-sm">
                        Borrow APY
                      </h3>
                      <h3 className="">{reserve.borrowAPY}</h3>
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
              <th className="text-primary-content bg-base-200">Supply APY</th>
              <th className="text-primary-content bg-base-200">Total borrow</th>
              <th className="text-primary-content bg-base-200">Borrow APY</th>
            </tr>
          </thead>
          <tbody>
            {reservesList.map((reserve) => (
              <tr key={reserve.address} className="cursor-pointer hover">
                <td className="bg-neutral">
                  <label
                    className="flex flex-row gap-4 cursor-pointer"
                    htmlFor="sbwr-modal"
                  >
                    <span className="w-4 h-full">
                      {/* TODO: get image from url */}
                      <img src="/Group.png" className="rounded object-cover" />
                    </span>
                    <span className="flex flex-col gap-0">
                      <h3 className="">
                        {reserve.name ? reserve.name : reserve.address}
                      </h3>
                      <h3 className="text-neutral-content text-sm">
                        {reserve.priceUSD}
                      </h3>
                    </span>
                  </label>
                </td>
                <td className="bg-neutral">
                  <h3>{reserve.LTV}</h3>
                </td>
                <td className="bg-neutral">
                  <label
                    className="flex flex-col cursor-pointer"
                    htmlFor="sbwr-modal"
                  >
                    <h3 className="text-neutral-content">
                      {reserve.totalSupply}
                    </h3>
                    <h3 className="text-neutral-content">
                      {reserve.name ? reserve.name : reserve.address}
                    </h3>
                    <h3 className="text-neutral-content text-sm">
                      {reserve.totalSupplyUSD}
                    </h3>
                  </label>
                </td>

                <td className="bg-neutral">
                  <h3>{reserve.supplyAPY}</h3>
                </td>
                <td className="bg-neutral">
                  <label
                    className="flex flex-col cursor-pointer"
                    htmlFor="sbwr-modal"
                  >
                    <h3 className="text-neutral-content">
                      {reserve.totalBorrow}
                    </h3>
                    <h3 className="text-neutral-content">
                      {reserve.name ? reserve.name : reserve.address}
                    </h3>
                    <h3 className="text-neutral-content text-sm">
                      {reserve.totalBorrowUSD}
                    </h3>
                  </label>
                </td>
                <td className="bg-neutral">
                  <h3>{reserve.borrowAPY}</h3>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SbwrModal />
    </div>
  );
};
