import { Grid, GridItem, useDisclosure } from '@chakra-ui/react';
import { Suspense } from 'react';
import Footer from 'components/Footer/Footer';
import Nav from 'components/Nav/Nav';
import Header from 'components/Header/Header';
import Pools from 'components/Pool/Pool';
import Account from 'components/Account/Account';
import { ErrorBoundary } from 'react-error-boundary';
import TransactionTakeover from 'components/TransactionTakeover/TransactionTakeover';
import { useCallback } from 'react';
import { selectedRpcAtom, switchboardAtom } from 'stores/settings';
import { useAtom, useSetAtom } from 'jotai';
import { DEFAULT_RPC_ENDPOINTS } from 'common/config';
import Loading from 'components/Loading/Loading';
import { ErrorFallback } from 'components/ErrorFallback/ErrorFallback';
import { selectedModalTabAtom, selectedReserveAtom } from 'stores/modal';

export default function Dashboard() {
  const { onOpen } = useDisclosure();
  const setSelectedRpc = useSetAtom(selectedRpcAtom);
  const setSelectedReserve = useSetAtom(selectedReserveAtom);
  const setSelectedModalTab = useSetAtom(selectedModalTabAtom);

  const selectReserveWithModal = useCallback(
    (reserveAddress: string) => {
      setSelectedModalTab(0);
      setSelectedReserve(reserveAddress);
      onOpen();
    },
    [onOpen, setSelectedReserve, setSelectedModalTab],
  );

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        setSelectedRpc(DEFAULT_RPC_ENDPOINTS[0]);
      }}
    >
      <Suspense fallback={<Loading />}>
        <Suspense>
          <TransactionTakeover />
        </Suspense>
        <Grid
          templateAreas={`"header header header"
                            "nav main side"
                            "nav main side"
                            "footer footer footer"`}
          gridTemplateRows={'64px 500px 1fr 50px'}
          gridTemplateColumns={'200px 1fr 400px'}
          minH='1000px'
          gap='1px'
        >
          <GridItem bg='neutral' area={'header'}>
            <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
              <Suspense fallback={<Loading />}>
                <Header />
              </Suspense>
            </ErrorBoundary>
          </GridItem>
          <GridItem area={'nav'}>
            <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
              <Suspense fallback={<Loading />}>
                <Nav />
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
          <GridItem bg='neutral' area={'side'}>
            <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
              <Suspense fallback={<Loading />}>
                <Account />
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
