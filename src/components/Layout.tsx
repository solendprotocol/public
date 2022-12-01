import { ContextProvider } from "../contexts/ContextProvider";
import { AppBar, Drawer } from "../components";
import { useAtom } from "jotai";
import Notifications from "../components/Notification";
import { themeAtom, sbv2ProgramAtom } from "stores/globalStates";
import { useEffect } from "react";
import SwitchboardProgram from "@switchboard-xyz/sbv2-lite";
import { CONNECTION } from "common/config";

const connection = CONNECTION;

const Layout = ({ children }) => {
  const [theme] = useAtom(themeAtom);
  const [, setSbv2Program] = useAtom(sbv2ProgramAtom);

  // Initialize the Switchboard-v2 Program on mount
  useEffect(() => {
    async function loadSbv2Program() {
      const sbv2 = await SwitchboardProgram.loadMainnet(connection);
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
