import { Text, Grid, GridItem, Modal, useDisclosure } from "@chakra-ui/react"
import { Suspense, useState } from "react";
import { Footer } from "components/Footer/Footer";
import NoSSR from 'react-no-ssr';
import Nav from "../../components/Nav/Nav";
import Header from "components/Header/Header";
import Wallet from "components/Wallet/Wallet";
import Pools from "components/Pool/Pool";
import Account from "components/Account/Account";
import { ErrorBoundary } from "react-error-boundary";
import TransactionTakeover from "components/TransactionTakeover/TransactionTakeover";
import { useCallback } from "react";
import { ReserveType, SelectedReserveType } from "stores/pools";
import { selectedRpcAtom } from "stores/settings";
import { useAtom, useSetAtom } from "jotai";
import { DEFAULT_RPC_ENDPOINTS } from "utils/config";


function ErrorFallback({error, resetErrorBoundary} : {error: Error, resetErrorBoundary: () => void}) {
  return (
    <div role="alert">
      <Text>Something went wrong:</Text>
      {/* <pre>{error.message}</pre> */}
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

export default function Dashboard() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const setSelectedRpc = useSetAtom(selectedRpcAtom);
  const [selectedReserve, setSelectedReserve] = useState<SelectedReserveType | null>(null);

  const selectReserveWithModal = useCallback((reserve: SelectedReserveType) => {
    setSelectedReserve(reserve);
    onOpen();
  }, [onOpen, setSelectedReserve])

  const deselectReserveWithModal = useCallback(() => {
    setSelectedReserve(null);
    onClose();
  }, [onOpen])

  return <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {
    setSelectedRpc(DEFAULT_RPC_ENDPOINTS[0])
  }}>
    <Suspense>
  <NoSSR>
    <TransactionTakeover 
      selectedReserve={selectedReserve} 
      onClose={deselectReserveWithModal} 
    /><Grid
    templateAreas={`"header header header"
                    "nav main wallet"
                    "nav main side"
                    "footer footer footer"`}
    gridTemplateRows={'64px 500px 1fr 50px'}
    gridTemplateColumns={'200px 1fr 350px'}
    h='auto'
    bg="line"
    gap='1px'
  >
    <GridItem bg="neutral" area={'header'}>
      <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
        <Suspense fallback={
      <Text>Loading...</Text>}>
          <Header/>
        </Suspense>
        </ErrorBoundary>
    </GridItem>
    <GridItem bg='neutral' area={'nav'}>
      <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
        <Suspense fallback={
      <Text>Loading...</Text>}>
            <Nav/>
        </Suspense>
      </ErrorBoundary>
    </GridItem>
    <GridItem bg='neutral' area={'main'}>
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {
      // setSelectedReserve(pools[0])
    }}>
      <Suspense fallback={
      <Text>Loading...</Text>}>
        <Pools selectReserveWithModal={selectReserveWithModal} />
      </Suspense>
      </ErrorBoundary>
    </GridItem>
    <GridItem bg='neutral' area={'wallet'}>
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
      <Suspense fallback={
      <Text>Loading...</Text>}>
        <Account/>
      </Suspense>
      </ErrorBoundary>
    </GridItem>
    <GridItem bg='neutral' area={'side'}>
      <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
      <Suspense fallback={
      <Text>Loading...</Text>}>
        <Wallet/>
      </Suspense>
      </ErrorBoundary>
    </GridItem>
    <GridItem bg='neutral' area={'footer'}>
      <Footer/>
    </GridItem>
  </Grid>
        </NoSSR>
  </Suspense>
  </ErrorBoundary>
}