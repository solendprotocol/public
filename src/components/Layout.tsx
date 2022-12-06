import { ContextProvider } from "../contexts/ContextProvider";
import { AppBar, Drawer } from "../components";
import { useAtom } from "jotai";
import Notifications from "../components/Notification";
import { themeAtom, sbv2ProgramAtom } from "stores/globalStates";
import { useEffect } from "react";
import { getSbv2Program } from "utils/assetPrices";


const Layout = ({ children }) => {
  const [theme] = useAtom(themeAtom);
  const [, setSbv2Program] = useAtom(sbv2ProgramAtom);

  // Initialize the Switchboard-v2 Program on mount
  useEffect(() => {
    async function loadSbv2Program() {
      const sbv2 = await getSbv2Program();
      setSbv2Program(sbv2);
    }
    loadSbv2Program();
  }, [setSbv2Program]);

  return (
    <div
      className="flex flex-col lg:flex-row md:flex-row h-screen antialiased bg-neutral  text-primary-content"
      data-theme={theme}
    >
      <ContextProvider>
        <Notifications />
        <AppBar />
        <Drawer>
          <main className="flex-1">{children}</main>
        </Drawer>
      </ContextProvider>
    </div>
  );
};
export default Layout;
