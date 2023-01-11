import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useAtom, useSetAtom } from "jotai";
import { createContext, ReactElement, useCallback, useContext, useEffect } from "react";
import { obligationsAtom, selectedObligationAtom } from "stores/obligations";
import { configAtom, connectionAtom, loadPoolsAtom, poolsAtom, refreshPoolsAtom, ReserveType, selectedPoolAtom } from "stores/pools";
import { publicKeyAtom } from "stores/wallet";
import { PROGRAM_ID } from "utils/config";
import { getPoolsFromChain, getReservesOfPool } from "utils/pools";

type StoreContextType = {};

export const StoreContext =
  createContext<StoreContextType>({});

export function StoreProvider({
    children,
  }: { children: React.ReactNode;}): ReactElement {
    const [config] = useAtom(configAtom);
    const loadPools = useSetAtom(loadPoolsAtom);
    const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom)
    const [_selectedObligation, setSelectedObligation] = useAtom(selectedObligationAtom)
    const [_obligations, setObligations] = useAtom(obligationsAtom)
    const {publicKey} = useWallet();
    const [_publicKeyInAtom, setPublicKeyInAtom] = useAtom(publicKeyAtom);

    console.log('wtf');
    useEffect(() => {
      setPublicKeyInAtom(publicKey)
    }, [publicKey])

    // The first time addresses are loaded, default to the first pool
    useEffect(() => {
      console.log('load config', config);
      if (config.length) {
        setSelectedPool(config[0])
        loadPools(true);
        console.log('loaded config', config);
      }
    }, [Boolean(config.length)]);

    useEffect(() => {
      loadPools(false)
    }, [config.join(',')])

    // const loadObligationAddresses = useCallback(async () => {  
    //   console.log('loadObligationAddresses')
    //   if (!publicKey) return;
      
    //   const obligations = await Promise.all(
    //     config.map(p => PublicKey.createWithSeed(
    //       publicKey,
    //       p.address.toBase58().slice(0, 32),
    //       PROGRAM_ID
    //     ).then(o => ({
    //       address: o,
    //       deposits: [],
    //       borrows: [],
    //     })))
    //   );
    //   console.log('setObligations(obligations)', obligations, config);
    //   setObligations(obligations);
    //   if (selectedPool) {
    //     console.log('setSelectedObligation');
    //     setSelectedObligation(await PublicKey.createWithSeed(
    //       publicKey,
    //       selectedPool.address.toBase58().slice(0, 32),
    //       PROGRAM_ID
    //     ))
    //   }

  //   }, [publicKey, config.map(p => p.address).join(',')]);

  // useEffect(() => {
  //   loadObligationAddresses();
  // }, [publicKey, config.map(p => p.address).join(',')])


    return (
      <StoreContext.Provider
        value={{}}
      >
        {children}
      </StoreContext.Provider>
    );
  }

export default (): StoreContextType => useContext(StoreContext);
