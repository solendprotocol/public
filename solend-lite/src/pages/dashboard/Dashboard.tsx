import { Text, Grid, GridItem, useDisclosure } from '@chakra-ui/react';
import { Suspense } from 'react';
import Footer from 'components/Footer/Footer';
import NoSSR from 'react-no-ssr';
import Nav from 'components/Nav/Nav';
import Header from 'components/Header/Header';
import Pools from 'components/Pool/Pool';
import Account from 'components/Account/Account';
import { ErrorBoundary } from 'react-error-boundary';
import TransactionTakeover from 'components/TransactionTakeover/TransactionTakeover';
import { useCallback } from 'react';
import { selectedReserveAtom } from 'stores/pools';
import { selectedRpcAtom } from 'stores/settings';
import { useSetAtom } from 'jotai';
import { DEFAULT_RPC_ENDPOINTS } from 'common/config';
import Loading from 'components/Loading/Loading';

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

export default function Dashboard() {
  const { onOpen } = useDisclosure();
  const setSelectedRpc = useSetAtom(selectedRpcAtom);
  const setSelectedReserve = useSetAtom(selectedReserveAtom);

  const selectReserveWithModal = useCallback(
    (reserveAddress: string) => {
      setSelectedReserve(reserveAddress);
      onOpen();
    },
    [onOpen, setSelectedReserve],
  );

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        setSelectedRpc(DEFAULT_RPC_ENDPOINTS[0]);
      }}
    >
      <Suspense fallback={<Loading />}>
        <NoSSR>
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
              <ErrorBoundary
                FallbackComponent={ErrorFallback}
                onReset={() => {}}
              >
                <Suspense fallback={<Loading />}>
                  <Header />
                </Suspense>
              </ErrorBoundary>
            </GridItem>
            <GridItem area={'nav'}>
              <ErrorBoundary
                FallbackComponent={ErrorFallback}
                onReset={() => {}}
              >
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
              <ErrorBoundary
                FallbackComponent={ErrorFallback}
                onReset={() => {}}
              >
                <Suspense fallback={<Loading />}>
                  <Account />
                </Suspense>
              </ErrorBoundary>
            </GridItem>
            <GridItem bg='neutral' area={'footer'}>
              <Footer />
            </GridItem>
          </Grid>
        </NoSSR>
      </Suspense>
    </ErrorBoundary>
  );
}
