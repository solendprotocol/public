import { Button, Grid, GridItem, Modal, useDisclosure } from "@chakra-ui/react"
import { Suspense, useState } from "react";
import { Footer } from "components/Footer/Footer";
import NoSSR from 'react-no-ssr';
import Nav from "../../components/Nav/Nav";
import Header from "components/Header/Header";
import Pools from "components/Pool/Pool";
import Account from "components/Account/Account";
import { ErrorBoundary } from "react-error-boundary";
import TransactionTakeover from "components/TransactionTakeover/TransactionTakeover";
import { useCallback } from "react";
import { ReserveType } from "stores/pools";


function ErrorFallback({error, resetErrorBoundary} : {error: Error, resetErrorBoundary: () => void}) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      {/* <pre>{error.message}</pre> */}
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

export default function Dashboard() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedReserve, setSelectedReserve] = useState<ReserveType | null>(null);

  const selectReserveWithModal = useCallback((reserve: ReserveType) => {
    setSelectedReserve(reserve);
    onOpen();
  }, [onOpen, setSelectedReserve])

  const deselectReserveWithModal = useCallback(() => {
    setSelectedReserve(null);
    onClose();
  }, [onOpen])

  return  <Suspense>
  <NoSSR>
    <TransactionTakeover 
      selectedReserve={selectedReserve} 
      onClose={deselectReserveWithModal} 
    /><Grid
    templateAreas={`"header header header"
                    "nav main side"
                    "footer footer footer"`}
    gridTemplateRows={'50px 1fr 50px'}
    gridTemplateColumns={'150px 1fr 350px'}
    h='auto'
    gap='1'
    color='blackAlpha.700'
    fontWeight='bold'
  >
    <GridItem bg='orange.300' area={'header'}>
      <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
        <Suspense fallback={"Loading..."}>
          <Header/>
        </Suspense>
        </ErrorBoundary>
    </GridItem>
    <GridItem bg='pink.300' area={'nav'}>
      <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
        <Suspense fallback={"Loading..."}>
            <Nav/>
        </Suspense>
      </ErrorBoundary>
    </GridItem>
    <GridItem bg='green.300' area={'main'}>
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {
      // setSelectedReserve(pools[0])
    }}>
      <Suspense fallback={"Loading..."}>
        <Pools selectReserveWithModal={selectReserveWithModal} />
      </Suspense>
      </ErrorBoundary>
    </GridItem>
    <GridItem bg='yellow.300' area={'side'}>
      <Suspense fallback={"Loading..."}>
        <Account/>
      </Suspense>
    </GridItem>
    <GridItem bg='blue.300' area={'footer'}>
      <Footer/>
    </GridItem>
  </Grid>
        </NoSSR>
  </Suspense>
}