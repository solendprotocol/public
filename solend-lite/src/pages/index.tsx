import Head from 'next/head';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ENVIRONMENT } from 'common/config';
import {
  BraveWalletAdapter,
  CoinbaseWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { selectedRpcAtom } from 'stores/settings';
import { useAtom } from 'jotai';
import { Suspense } from 'react';
import Loading from 'components/Loading/Loading';
import NoSSR from 'react-no-ssr';
import Solend from './dashboard';

require('@solana/wallet-adapter-react-ui/styles.css');

export default function Index() {
  const [rpc] = useAtom(selectedRpcAtom);
  const network = ENVIRONMENT as WalletAdapterNetwork;
  const solflare = new SolflareWalletAdapter({ network });
  const coinbase = new CoinbaseWalletAdapter();
  const brave = new BraveWalletAdapter();

  return (
    <>
      <Head>
        <title>Solend | Lend and borrow crypto on Solana</title>
        <meta
          name='description'
          content='Solend is a DeFi protocol for lending and borrowing on the Solana blockchain. Think Aave or Compound on Solana. Solend allows anyone with an internet connection to earn interest by lending their crypto assets, and allows them to use their deposits as collateral for borrowing.'
        />
        <meta
          property='og:description'
          content='Solend is a DeFi protocol for lending and borrowing on the Solana blockchain. Think Aave or Compound on Solana. Solend allows anyone with an internet connection to earn interest by lending their crypto assets, and allows them to use their deposits as collateral for borrowing.'
        />
        <meta property='og:type' content='website' />
        <meta
          property='og:title'
          content='Solend | Lend and borrow on Solana'
        />
        <meta
          property='og:image'
          content='https://solend-image-assets.s3.us-east-2.amazonaws.com/og.jpg'
        />
        <meta name='twitter:card' content='summary' />
        <meta name='twitter:site' content='@solendprotocol' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link
          rel='apple-touch-icon'
          sizes='180x180'
          href='/apple-touch-icon.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='32x32'
          href='/favicon-32x32.png'
        />
        <link rel='icon' href='/favicon.ico' />
        <link
          rel='icon'
          type='image/png'
          sizes='16x16'
          href='/favicon-16x16.png'
        />
        <link rel='manifest' href='/site.webmanifest' />
        <link rel='mask-icon' href='/safari-pinned-tab.svg' color='#5bbad5' />
        <meta name='msapplication-TileColor' content='#da532c' />
        <meta name='theme-color' content='#ffffff' />
      </Head>
      <ConnectionProvider endpoint={rpc.endpoint}>
        <WalletProvider wallets={[solflare, coinbase, brave]} autoConnect>
          <WalletModalProvider>
            <NoSSR>
              <Suspense fallback={<Loading />}>
                <Solend />
              </Suspense>
            </NoSSR>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  );
}
