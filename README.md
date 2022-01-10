**Note: The Solend TS is in early stages of release and is subject to changes and improvements. To report any bugs or feature requests, the #dev-support channel in the [Solend Discord](https://discord.gg/aGXvPNGXDT) is the fastest way to get a response.**


## Installation

```
yarn add @solendprotocol/solend-sdk
```


# Solend Typescript SDK

This is the Solend Typescript to interact with http://solend.fi. 

For the full set of developer tools, check out the brand new

[
<img width="200" alt="Screen Shot 2022-01-09 at 5 54 30 PM" src="https://user-images.githubusercontent.com/89805726/148710356-a6cdb798-934a-459d-b795-d4a1099168db.png">](https://dev.solend.fi/).

[Latest API documentation](http://sdk.solend.fi/)


## Basic usage

### Reading account data
```typescript
// There are three levels of data you can request (and cache) about the lending market.
// 1. Initalize market with parameters and metadata
const market = await SolendMarket.initialize(
  connection
);
console.log(market.reserves.map(reserve => reserve.config.loanToValueRatio);

// 2. Read on-chain accounts for reserve data and cache
await market.loadReserves();

const usdcReserve = market.reserves.find(res => res.config.symbol === 'USDC');
console.log(usdcReserve.stats.totalDepositsWads.toString());

// Read Solend liquidity mining stats
await market.loadRewards()
console.log(reserve.stats.totalSupplyAPY().rewards); // {apy: 0.07, rewardMint: "SLND...

// Refresh all cached data
market.refreshAll()

```

### Perform lending action
```typescript
const solendAction = await SolendAction.buildDepositTxns(
    connection,
    amountBase,
    symbol,
    publicKey,
    'mainnet'
  );

  await solendAction.sendTransactions(sendTransaction); // sendTransaction from wallet adapter or custom
```

## Upcoming

- Showing and claiming past reward lots
- Better caching of data
- React hook API

## FAQ
**Interest rates do not match what's show on solend.fi** 

The Solend SDK pulls certain price data from cached sources from our backend api that's different from solend.fi's sources. Divergences should be very small and these price sources will soon be consolidated.

**Multiple transactions being created for a lending action**

Due to transaction size limits of Solana, a user with a high amount of positions might need their lending action to be broken into multiple transactions. Usually this involves creating or closing associated token accounts for up to 3 transactions.

**Values are weird on devnet**

Partner rewards for liquidity mining have limited support and this SDK has limited support in devnet.
