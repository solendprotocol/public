import { FC } from "react";
import { ReactSVG } from "react-svg";
import { useAtom } from "jotai";
import { themeAtom, selectedPoolAtom } from "stores/globalStates";
import { usePoolsList } from "hooks/usePoolsList";
import { useMediaQuery } from "react-responsive";
import { RpcSwitcher } from "../components";
const Drawer: FC = (props) => {
  const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);
  const [theme, setTheme] = useAtom(themeAtom);
  const { poolList, isLoading, isError } = usePoolsList();
  const isMobile = useMediaQuery({ query: `(max-width: 760px)` });

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
      <a className="text-xlg">
        {" "}
        <label htmlFor="my-drawer" className="w-full">
          {p.name ? p.name : p.address}{" "}
        </label>
      </a>
    </li>
  ));

  return (
    <div className="flex-1 drawer">
      {/* <div className="h-screen drawer drawer-mobile w-full"> */}
      <input id="my-drawer" type="checkbox" className="grow drawer-toggle" />
      <div className="items-center  drawer-content">{props.children}</div>

      {/* SideBar / Drawer */}
      {isMobile && (
        <div className="drawer-side">
          <label htmlFor="my-drawer" className="drawer-overlay"></label>
          <div className="p-4 overflow-y-auto menu w-80 bg-neutral">
            <span className="pb-2">
              {" "}
              <RpcSwitcher />
            </span>
            {poolListItems}
            <span className="flex flex-row gap-4 p-2">
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
        </div>
      )}
    </div>
  );
};
export default Drawer;
