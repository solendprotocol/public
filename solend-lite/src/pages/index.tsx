import type { NextPage } from "next";
import Head from "next/head";

import { HomeView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Solend Lite</title>
        <meta name="description" content="Solend lite" />
      </Head>
      <HomeView />
    </div>
  );
};

export default Home;
