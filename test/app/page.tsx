
import dynamic from "next/dynamic";
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { RPC_ENDPOINT, ENVIRONMENT } from "utils/config";
import {
  BraveWalletAdapter,
  CoinbaseWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

const SuspenseComponent = dynamic(
  () => import("components/dashboard/Dashboard"),
  { suspense: true }
);

export default function Home() {

  const network = ENVIRONMENT as WalletAdapterNetwork;

  const phantom = new PhantomWalletAdapter();
  const solflare = new SolflareWalletAdapter({ network });
  const coinbase = new CoinbaseWalletAdapter();
  const brave = new BraveWalletAdapter();
  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT.endpoint}>
        <WalletProvider wallets={[
phantom,
solflare,
coinbase,
brave,
        ]} autoConnect>
            <WalletModalProvider>
    <Dashboard/>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
  )
}
