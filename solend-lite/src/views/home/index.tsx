import BigNumber from "bignumber.js";
import { useReservesList } from "hooks/useReservesList";
import { useAtom } from "jotai";
import { FC, useEffect, useState } from "react";

import { useWallet } from "@solana/wallet-adapter-react";
import {
  connectionAtom,
  selectedPoolAtom,
  selectedReserveAtom,
} from "stores/globalStates";
import {
  SbwrModal,
  PoolPositionModal,
  MobileTable,
  DesktopTable,
} from "views/home/components";
import { formatPoolValue, formatPoolName } from "utils/formatUtils";
import { Error, Loader } from "components";
import { PublicKey } from "@solana/web3.js";
import { parseLendingMarket } from "@solendprotocol/solend-sdk/dist/state/lendingMarket";
import { SOLEND_ADDRESSES } from "common/config";

export const HomeView: FC = ({}) => {
  const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);
  const [selectedReserve, setSelectedReserve] = useAtom(selectedReserveAtom);
  const { reservesList, isLoading, isError } = useReservesList();
  const { connected } = useWallet();
  const [connection] = useAtom(connectionAtom);
  const [showAPY, setShowAPY] = useState(true);
  const [poolCreator, setPoolCreator] = useState<string | null>(null);

  useEffect(() => {
    const showPoolCreator = async () => {
      const poolPubkey = new PublicKey(selectedPool.address);
      const poolInfo = await connection.getAccountInfo(poolPubkey);
      if (!poolInfo) {
        setPoolCreator("Unknown");
        return;
      }
      const parsedPool = parseLendingMarket(poolPubkey, poolInfo);
      const creatorPubkey = parsedPool.info.owner.toBase58();
      if (SOLEND_ADDRESSES.has(creatorPubkey)) {
        setPoolCreator("Solend");
        return;
      }
      setPoolCreator(
        creatorPubkey.slice(0, 4) + "..." + creatorPubkey.slice(-4)
      );
      return;
    };
    showPoolCreator();
  }, [connection, selectedPool.address]);

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

  const handleSelectReserve = (reserve) => {
    setSelectedReserve(reserve);
  };
  return (
    <div className="flex flex-col p-10 py-4 md:py-10 lg:py-10 h-screen gap-4">
      {/* pool title */}

      <span className="">
        {" "}
        <h1 className="text-2xl">
          {selectedPool.name ? formatPoolName(selectedPool.name) + " Pool" : ""}
        </h1>
      </span>
      {/* pool details starting here */}
      <div className="divider bg-base-200"></div>
      {/* for mobile devices */}
      <div className="flex flex-col gap-6 md:hidden lg:hidden">
        <div className="flex flex-row justify-between">
          {" "}
          <span className="flex flex-col gap-2">
            <h3 className="text-neutral-content">Creator</h3>
            <h3>{poolCreator ? poolCreator : ""}</h3>{" "}
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
          <h3>{poolCreator ? poolCreator : ""}</h3>{" "}
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
        <MobileTable
          reservesList={reservesList}
          showAPY={showAPY}
          handleSelectReserve={handleSelectReserve}
        />
      </div>

      {/* Pool assets for larger */}
      <div className="md:flex lg:flex hidden">
        <DesktopTable
          reservesList={reservesList}
          showAPY={showAPY}
          handleSelectReserve={handleSelectReserve}
        />
      </div>
      <SbwrModal />
      <PoolPositionModal />
    </div>
  );
};
