import { FC, useState } from "react";
import Link from "next/link";
import { ReactSVG } from "react-svg";
import { useAtom } from "jotai";
import { themeAtom } from "stores/themeStore";

const Drawer: FC = (props) => {
  const [selectedPool, setSelectedPool] = useState("Main pool");
  const [theme, setTheme] = useAtom(themeAtom);

  const pools = [
    { name: "Main pool" },
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
    {},
    {},
    {},
    {},
  ];
  return (
    <div className="flex-1 drawer">
      {/* <div className="h-screen drawer drawer-mobile w-full"> */}
      <input id="my-drawer" type="checkbox" className="grow drawer-toggle" />
      <div className="items-center  drawer-content">{props.children}</div>

      {/* SideBar / Drawer */}
      <div className="drawer-side">
        <label htmlFor="my-drawer" className="drawer-overlay"></label>
        <div className="p-4 overflow-y-auto menu w-80 bg-neutral">
          {pools.map((pool) => (
            <li className={`${selectedPool == pool?.name && "bordered"}`}>
              <a className="text-xlg">{pool?.name || "Pool"}</a>
            </li>
          ))}
          <span className="flex flex-row gap-4 p-2">
            <span
              onClick={() => setTheme(theme == "light" ? "dark" : "light")}
              className="cursor-pointer btn bg-base-200"
            >
              <ReactSVG
                wrapper="span"
                src={theme == "dark" ? "/icons/sun.svg" : "/icons/moon.svg"}
              />
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
export default Drawer;
