**Note: The Solend TS is in early stages of release and is subject to changes and improvements. To report any bugs or feature requests, the #dev-support channel in the [Solend Discord](https://discord.gg/aGXvPNGXDT) is the fastest way to get a response.**

## Installation

```
yarn add @solendprotocol/solend-sdk
```

# Solend Typescript SDK

This is the Solend Typescript to interact with http://solend.fi.

For the full set of developer tools, check out the brand new

[
<img width="200" alt="Screen Shot 2022-01-09 at 5 54 30 PM" src="https://user-images.githubusercontent.com/89805726/148710356-a6cdb798-934a-459d-b795-d4a1099168db.png">](https://dev.solend.fi/)

[Latest API documentation](http://sdk.solend.fi/)

## Basic usage

### Reading data

```typescript
// There are three levels of data you can request (and cache) about the lending market.
// 1. Initalize market with parameters and metadata
const market = await SolendMarket.initialize(
  connection,
  "production", // optional environment argument
  new PublicKey("7RCz8wb6WXxUhAigok9ttgrVgDFFFbibcirECzWSBauM") // optional market address (TURBO SOL). Defaults to 'Main' market
);
console.log(market.reserves.map((reserve) => reserve.config.loanToValueRatio));

// 2. Read on-chain accounts for reserve data and cache
await market.loadReserves();

const usdcReserve = market.reserves.find((res) => res.config.symbol === "USDC");
console.log(usdcReserve.stats.totalDepositsWads.toString());

// Read Solend liquidity mining stats
await market.loadRewards();
console.log(reserve.stats.totalSupplyAPY().rewards); // {apy: 0.07, rewardMint: "SLND...

// Refresh all cached data
market.refreshAll();

const obligation = market.fetchObligationByWallet("[WALLET_ID]");
console.log(obligation.stats.borrowLimit);
```

### Perform lending action

```typescript
// Create one or more (may contain setup accuont creation txns) to perform a Solend action.
const solendAction = await SolendAction.buildDepositTxns(
  connection,
  amountBase,
  symbol,
  publicKey,
  "production",
  new PublicKey("7RCz8wb6WXxUhAigok9ttgrVgDFFFbibcirECzWSBauM") // optional market address (TURBO SOL). Defaults to 'Main' market
);

await solendAction.sendTransactions(sendTransaction); // sendTransaction from wallet adapter or custom
```

### Manage user rewards

```typescript
const { wallet } = useWallet();
// const wallet = anchor.Wallet.local();

const solendWallet = await SolendWallet.initialize(wallet, connection);

// Claim rewards
const mndeRewards = solendWallet.rewards["MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey"];
console.log(
  "Claimable rewards:",
  mndeRewards.claimableAmount / 10 ** mndeRewards.decimals
);

const sig1 = await mndeRewards.rewardClaims
  .find((claim) => !claim.metadata.claimedAt)
  ?.claim();

// Exercise options (after claiming)
const slndOptionClaim = solendWallet.rewards["SLND_OPTION"].rewardClaims.find(
  (claim) => claim.metadata.optionMarket.userBalance
);

const sig2 = await slndOptionClaim.exercise(
  slndOptionClaim.optionMarket.userBalance
);

const [setupIxs, claimIxs] = await solendWallet.getClaimIxs();
// Claim all claimable rewards
```

## Upcoming

- Better support for obligation based actions (Fully repay borrow, max borrow up to borrow limit, etc.)
- React hook API

## FAQ

#### Interest rates do not match what's show on solend.fi

The Solend SDK pulls certain price data from cached sources from our backend api that's different from solend.fi's sources. Divergences should be very small and these price sources will soon be consolidated.

#### Multiple transactions being created for a lending action

Due to transaction size limits of Solana, a user with a high amount of positions might need their lending action to be broken into multiple transactions. Usually this involves creating or closing associated token accounts for up to 3 transactions.

#### Values are weird on devnet

Partner rewards and liquidity mining are not present on devnet.
