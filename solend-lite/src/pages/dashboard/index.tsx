import { useMediaQuery } from '@chakra-ui/react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ENVIRONMENT } from 'common/config';
import { selectedRpcAtom } from 'stores/settings';
import { useAtom } from 'jotai';
import MobileDashboard from 'components/Dashboard/MobileDashboard';
import Dashboard from 'components/Dashboard/Dashboard';
import NoSSR from 'react-no-ssr';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  CoinbaseWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';

require('@solana/wallet-adapter-react-ui/styles.css');

export default function Solend() {
  const [rpc] = useAtom(selectedRpcAtom);
  const network = ENVIRONMENT as WalletAdapterNetwork;
  const [isLargerThan800] = useMediaQuery('(min-width: 800px)');
  const solflare = new SolflareWalletAdapter({ network });
  const coinbase = new CoinbaseWalletAdapter();

  return (
    <ConnectionProvider endpoint={rpc.endpoint}>
      <WalletProvider wallets={[solflare, coinbase]} autoConnect>
        <WalletModalProvider>
          <NoSSR>{isLargerThan800 ? <Dashboard /> : <MobileDashboard />}</NoSSR>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
