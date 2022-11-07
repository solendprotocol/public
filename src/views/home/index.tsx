import Image from "next/image";
import { FC, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { SbwrModal, PoolPositionModal } from "views/home/components";

export const HomeView: FC = ({}) => {
  const { publicKey, connected } = useWallet();
  const assets = [
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
  ];
  console.log(publicKey, connected, "HERE IS THE CONNECTION");
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
        {connected && (
          <label
            className="btn bg-base-200 cursor-pointer text-primary-content"
            htmlFor="pp-modal"
          >
            Pool Position
          </label>
        )}
      </div>

      <div className="divider bg-base-200"></div>

      {/* Pool assets for mobile  */}
      <div className="md:hidden lg:hidden flex">
        <table className="table w-full">
          <tbody>
            {assets.map(() => (
              <tr className="cursor-pointer hover">
                <td className="bg-neutral">
                  <div className="flex flex-col gap-4 justify-center align-middle">
                    <span className="w-4 h-full">
                      <img src="/Group.png" className="rounded object-cover" />
                    </span>
                    <span className="flex flex-col gap-0">
                      <h3 className="">SLND</h3>
                      <h3 className="text-neutral-content text-sm">$902</h3>
                    </span>
                  </div>
                </td>

                <td className="bg-neutral">
                  <span className="flex flex-col">
                    <span className="flex flex-row justify-between align-middle">
                      <h3 className="text-neutral-content text-sm">LTV</h3>
                      <h3 className="">35%</h3>
                    </span>
                    <span className="flex flex-row justify-between align-middle">
                      {" "}
                      <h3 className="text-neutral-content text-sm">
                        Total Supply
                      </h3>{" "}
                      <h3 className="text-neutral-content">6,123,222</h3>
                    </span>
                    <span className="flex flex-row justify-between align-middle">
                      {" "}
                      <h3 className="text-neutral-content text-sm">
                        Total Borrow
                      </h3>
                      <h3 className="text-neutral-content">41,800</h3>
                    </span>
                    <span className="flex flex-row justify-between align-middle">
                      {" "}
                      <h3 className="text-neutral-content text-sm">
                        Supply APY
                      </h3>
                      <h3 className="">11.89%</h3>
                    </span>
                    <span className="flex flex-row justify-between align-middle">
                      {" "}
                      <h3 className="text-neutral-content text-sm">
                        Borrow APY
                      </h3>
                      <h3 className="">182.78%</h3>
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
            {assets.map(() => (
              <tr className="cursor-pointer hover">
                <td className="bg-neutral">
                  <label
                    className="flex flex-row gap-4 cursor-pointer"
                    htmlFor="sbwr-modal"
                  >
                    <span className="w-4 h-full">
                      <img src="/Group.png" className="rounded object-cover" />
                    </span>
                    <span className="flex flex-col gap-0">
                      <h3 className="">SLND</h3>
                      <h3 className="text-neutral-content text-sm">$902</h3>
                    </span>
                  </label>
                </td>
                <td className="bg-neutral">
                  <h3>33%</h3>
                </td>
                <td className="bg-neutral">
                  <label
                    className="flex flex-col cursor-pointer"
                    htmlFor="sbwr-modal"
                  >
                    <h3 className="text-neutral-content">6,122,243</h3>
                    <h3 className="text-neutral-content">SLND</h3>
                    <h3 className="text-neutral-content text-sm">$8920220</h3>
                  </label>
                </td>

                <td className="bg-neutral">
                  <h3>33%</h3>
                </td>
                <td className="bg-neutral">
                  <label
                    className="flex flex-col cursor-pointer"
                    htmlFor="sbwr-modal"
                  >
                    <h3 className="text-neutral-content">6,122,243</h3>
                    <h3 className="text-neutral-content">SLND</h3>
                    <h3 className="text-neutral-content text-sm">$8920220</h3>
                  </label>
                </td>
                <td className="bg-neutral">
                  <h3>33%</h3>
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
