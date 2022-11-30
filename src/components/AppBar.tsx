import { useState } from "react";
import { Hambuger, RpcSwitcher } from "../components";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ReactSVG } from "react-svg";
import { useAtom } from "jotai";
import { themeAtom, selectedPoolAtom } from "stores/globalStates";
import Image from "next/image";
import { usePoolsList } from "hooks/usePoolsList";

const AppBar = ({}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);
  const [theme, setTheme] = useAtom(themeAtom);
  const { poolList, isLoading, isError } = usePoolsList();

  // TODO: return proper loading and error here
  if (isLoading) return <div></div>;
  if (isError) return <div></div>;
  const poolListItems = poolList!.map((p) => (
    <li
      key={p.address}
      onClick={() => {
        setSelectedPool({ address: p.address, name: p.name });
      }}
      className={`${selectedPool.address === p.address && "bordered"}`}
    >
      <a className="text-xlg">{p.name ? p.name : p.address}</a>
    </li>
  ));

  // TODO: Merge this with Drawer.tsx (so that we have only one component for the sidebar)
  // check AppBar.tsx and Drawer.tsx
  return (
    <div className="bg-neutral w-full md:w-60 inset-y-0">
      {/* desktop side bar */}
      <aside className="md:w-60 md:flex lg:flex inset-y-0 h-full hidden flex-col border-r-2 border-base-200 gap-6 fixed">
        <span className="flex items-center gap-2 px-6 pt-10">
          <Image
            src="/Group.png"
            alt="Solend Logo"
            width={25}
            height={25}
            className="w-8"
          />
          <h1 className="text-xl bold md:text-2xl lg:text-2xl">Solend Lite</h1>
        </span>
        <span className="px-4">
          <WalletMultiButton className="btn btn-primary w-40" />
        </span>
        <div className="h-4/6  flex flex-col">
          <ul className="menu overflow-y-scroll ">{poolListItems}</ul>
        </div>

        {/* desktop footer */}
        <div className="p-4 h-full flex flex-col justify-end">
          <span className="flex flex-row gap-4">
            <RpcSwitcher />
            <span
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="cursor-pointer btn bg-base-200"
            >
              <ReactSVG
                wrapper="span"
                src={theme == "dark" ? "/icons/sun.svg" : "/icons/moon.svg"}
              />
            </span>
          </span>
        </div>
      </aside>

      {/* mobile nav bar */}
      <nav className="bg-neutral flex flex-row  w-full p-2 py-4 gap-2 items-center lg:hidden md:hidden">
        <label htmlFor="my-drawer" className="">
          <Hambuger />
        </label>
        <span className="flex items-center gap-2">
          <Image
            src="/Group.png"
            alt="Solend Logo"
            width={25}
            height={25}
            className="w-8"
          />

          <h1 className="text-2xl bold">Solend Lite</h1>
        </span>
        <span className="pl-4">
          <WalletMultiButton className="btn btn-primary w-35" />
        </span>
      </nav>
    </div>
  );
};

export default AppBar;
