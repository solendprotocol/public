import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { createContext, ReactElement, useContext } from "react";
type StoreContextType = {};

export const StoreContext =
  createContext<StoreContextType>({});

export function StoreProvider({
    children,
  }: { children: React.ReactNode;}): ReactElement {
    return (
      <StoreContext.Provider
        value={{}}
      >
        {children}
      </StoreContext.Provider>
    );
  }

export default (): StoreContextType => useContext(StoreContext);
