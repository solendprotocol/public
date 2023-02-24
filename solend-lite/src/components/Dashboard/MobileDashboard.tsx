import {
  Text,
  Grid,
  GridItem,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody,
} from '@chakra-ui/react';
import { Suspense, useEffect } from 'react';
import Footer from 'components/Footer/Footer';
import Nav from 'components/Nav/Nav';
import Header from 'components/Header/Header';
import Pools from 'components/Pool/Pool';
import Account from 'components/Account/Account';
import { ErrorBoundary } from 'react-error-boundary';
import TransactionTakeover from 'components/TransactionTakeover/TransactionTakeover';
import { useCallback } from 'react';
import { selectedReserveAtom } from 'stores/pools';
import { selectedRpcAtom } from 'stores/settings';
import { useAtom, useSetAtom } from 'jotai';
import { DEFAULT_RPC_ENDPOINTS } from 'common/config';
import Loading from 'components/Loading/Loading';
import { useWallet } from '@solana/wallet-adapter-react';
import { setPublicKeyAtom } from 'stores/wallet';
import { configAtom } from 'stores/config';

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div role='alert'>
      <Text>Something went wrong:</Text>
      <Text variant='secondary'>{error.message}</Text>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export default function MobileDashboard() {
  const {
    isOpen: isNavOpen,
    onOpen: onNavOpen,
    onClose: onNavClose,
  } = useDisclosure();
  const {
    isOpen: isAccountOpen,
    onOpen: onAccountOpen,
    onClose: onAccountClose,
  } = useDisclosure();
  const { onOpen } = useDisclosure();
  const setSelectedRpc = useSetAtom(selectedRpcAtom);
  const setSelectedReserve = useSetAtom(selectedReserveAtom);
  const [config] = useAtom(configAtom);
  const setPublicKeyInAtom = useSetAtom(setPublicKeyAtom);
  const { publicKey } = useWallet();

  const selectReserveWithModal = useCallback(
    (reserveAddress: string) => {
      setSelectedReserve(reserveAddress);
      onOpen();
    },
    [onOpen, setSelectedReserve],
  );
  const uniqueConfigHash = config.map((c) => c.address).join(',');
  const pubString = publicKey?.toBase58();
  useEffect(() => {
    setPublicKeyInAtom(pubString ?? null);
  }, [pubString, uniqueConfigHash, setPublicKeyInAtom]);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        setSelectedRpc(DEFAULT_RPC_ENDPOINTS[0]);
      }}
    >
      <Suspense fallback={<Loading />}>
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
          <Suspense>
            <TransactionTakeover />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
          <Suspense fallback={<Loading />}>
            <Drawer isOpen={isNavOpen} placement='left' onClose={onNavClose}>
              <DrawerOverlay />
              <DrawerContent>
                <DrawerBody padding={2}>
                  <Nav onClose={onNavClose} />
                </DrawerBody>
              </DrawerContent>
            </Drawer>
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
          <Suspense fallback={<Loading />}>
            <Drawer
              isOpen={isAccountOpen}
              placement='right'
              onClose={onAccountClose}
            >
              <DrawerOverlay />
              <DrawerContent>
                <DrawerBody padding={2}>
                  <Account />
                </DrawerBody>
              </DrawerContent>
            </Drawer>
          </Suspense>
        </ErrorBoundary>

        <Grid
          templateAreas={`"header"
                    "main"
                    "footer"`}
          gridTemplateRows={'64px 1fr 50px'}
          gridTemplateColumns={'1fr'}
          minH='1000px'
          gap='1px'
        >
          <GridItem bg='neutral' area={'header'}>
            <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
              <Suspense fallback={<Loading />}>
                <Header openNav={onNavOpen} openAccount={onAccountOpen} />
              </Suspense>
            </ErrorBoundary>
          </GridItem>
          <GridItem bg='neutral' area={'main'}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Suspense fallback={<Loading />}>
                <Pools selectReserveWithModal={selectReserveWithModal} />
              </Suspense>
            </ErrorBoundary>
          </GridItem>
          <GridItem bg='neutral' area={'footer'}>
            <Footer />
          </GridItem>
        </Grid>
      </Suspense>
    </ErrorBoundary>
  );
}
