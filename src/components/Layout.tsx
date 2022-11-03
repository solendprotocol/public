import { useState } from "react";
import { useRouter } from "next/router";
import { ContextProvider } from "../contexts/ContextProvider";
import { AppBar, Drawer } from "../components";
import { useAtom } from "jotai";

import Notifications from "../components/Notification";
import { themeAtom } from "stores/themeStore";

const Layout = ({ children }) => {
  const [theme] = useAtom(themeAtom);
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
