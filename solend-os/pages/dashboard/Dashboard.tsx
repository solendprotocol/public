import { Grid, GridItem } from "@chakra-ui/react"
import { Suspense, useCallback, useEffect } from "react";
import { useAtom } from 'jotai';
import { connectionAtom, poolsAtom, selectedPoolAtom, ReserveType } from 'stores/pools';
import { obligationsAtom, selectedObligationAtom } from 'stores/obligations'; 
import { PublicKey } from "@solana/web3.js";
import { getPoolsFromChain, getReservesOfPool } from "utils/pools";
import { SolendObligation } from "../../../solend-sdk/src/classes/obligation";
import { PROGRAM_ID } from "utils/config";
import { useWallet } from "@solana/wallet-adapter-react";
import { Account } from "components/account/Account";
import { Footer } from "components/footer/Footer";
import dynamic from "next/dynamic";

const Header = dynamic(
  () => import("../../components/header/Header"),
  { ssr: false }
);

const Nav = dynamic(
  () => import("../../components/nav/Nav"),
  { ssr: false }
);

const Pools = dynamic(
  () => import("../../components/pools/Pools"),
  { ssr: false }
);

export default function Dashboard() {
  return  <Grid
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
      <Suspense fallback={"Loading..."}>
        <Header />
      </Suspense>
    </GridItem>
    <GridItem bg='pink.300' area={'nav'}>
      <Suspense fallback={"Loading..."}>
        <Nav/>
      </Suspense>
    </GridItem>
    <GridItem bg='green.300' area={'main'}>
      <Suspense fallback={"Loading..."}>
        <Pools/>
      </Suspense>
    </GridItem>
    <GridItem bg='yellow.300' area={'side'}>
      {/* <Suspense fallback={"Loading..."}>
      <Account/>
      </Suspense> */}
    </GridItem>
    <GridItem bg='blue.300' area={'footer'}>
      <Footer/>
    </GridItem>
  </Grid>
}