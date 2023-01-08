import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useAtom, useSetAtom } from "jotai";
import { createContext, ReactElement, useCallback, useContext, useEffect } from "react";
import { obligationsAtom, selectedObligationAtom } from "stores/obligations";
import { connectionAtom, loadPoolsAtom, poolsAtom, refreshPoolsAtom, ReserveType, selectedPoolAtom } from "stores/pools";
import { publicKeyAtom } from "stores/wallet";
import { PROGRAM_ID } from "utils/config";
import { getPoolsFromChain, getReservesOfPool } from "utils/pools";

type StoreContextType = {};

export const StoreContext =
  createContext<StoreContextType>({});

export function StoreProvider({
    children,
  }: { children: React.ReactNode;}): ReactElement {
    const [pools, setPools] = useAtom(poolsAtom);
    const loadPools = useSetAtom(loadPoolsAtom);
    const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom)
    const [_selectedObligation, setSelectedObligation] = useAtom(selectedObligationAtom)
    const [_obligations, setObligations] = useAtom(obligationsAtom)
    const {publicKey} = useWallet();
    const [_publicKeyInAtom, setPublicKeyInAtom] = useAtom(publicKeyAtom);

    useEffect(() => {
      setPublicKeyInAtom(publicKey)
    }, [publicKey])

    // The first time addresses are loaded, default to the first pool
    useEffect(() => {
      if (pools.length) {
        setSelectedPool(pools[0].address)
      }
    }, [Boolean(pools.length)]);

    useEffect(() => {
      loadPools()
    }, [pools.map(p => p.address).join(',')])

    const loadObligationAddresses = useCallback(async () => {  
      console.log('loadObligationAddresses')
      if (!publicKey) return;
      
      const obligations = await Promise.all(
        pools.map(p => PublicKey.createWithSeed(
          publicKey,
          p.address.toBase58().slice(0, 32),
          PROGRAM_ID
        ).then(o => ({
          address: o,
          deposits: [],
          borrows: [],
        })))
      );
      console.log('setObligations(obligations)', obligations, pools);
      setObligations(obligations);
      if (selectedPool) {
        console.log('setSelectedObligation');
        setSelectedObligation(await PublicKey.createWithSeed(
          publicKey,
          selectedPool.address.toBase58().slice(0, 32),
          PROGRAM_ID
        ))
      }

    }, [publicKey, pools.map(p => p.address).join(',')]);

  useEffect(() => {
    loadObligationAddresses();
  }, [publicKey, pools.map(p => p.address).join(',')])


    return (
      <StoreContext.Provider
        value={{}}
      >
        {children}
      </StoreContext.Provider>
    );
  }

export default (): StoreContextType => useContext(StoreContext);
