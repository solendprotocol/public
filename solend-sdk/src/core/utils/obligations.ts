import { Connection, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { Obligation, OBLIGATION_SIZE, parseObligation } from "../../state";
import { ReserveType } from "../types";
import { sha256 as sha256$1 } from "js-sha256";
import { getBatchMultipleAccountsInfo } from "./utils";
import { U64_MAX } from "../constants";

export type FormattedObligation = ReturnType<typeof formatObligation>;

export function formatObligation(
  obligation: { pubkey: PublicKey; info: Obligation },
  pool: { reserves: Array<ReserveType> }
) {
  const poolAddress = obligation.info.lendingMarket.toBase58();
  let minPriceUserTotalSupply = new BigNumber(0);
  let minPriceBorrowLimit = new BigNumber(0);
  let maxPriceUserTotalWeightedBorrow = new BigNumber(0);

  const deposits = obligation.info.deposits.map((d) => {
    const reserveAddress = d.depositReserve.toBase58();
    const reserve = pool.reserves.find((r) => r.address === reserveAddress);

    if (!reserve)
      throw Error("Deposit in obligation does not exist in the pool");

    const amount = new BigNumber(d.depositedAmount.toString())
      .shiftedBy(-reserve.decimals)
      .times(reserve.cTokenExchangeRate);
    const amountUsd = amount.times(reserve.price);

    minPriceUserTotalSupply = minPriceUserTotalSupply.plus(
      amount.times(reserve.minPrice)
    );

    minPriceBorrowLimit = minPriceBorrowLimit.plus(
      amount.times(reserve.minPrice).times(reserve.loanToValueRatio)
    );

    return {
      liquidationThreshold: reserve.liquidationThreshold,
      loanToValueRatio: reserve.loanToValueRatio,
      symbol: reserve.symbol,
      price: reserve.price,
      mintAddress: reserve.mintAddress,
      reserveAddress,
      amount,
      amountUsd,
      annualInterest: amountUsd.multipliedBy(reserve.supplyInterest),
    };
  });

  const borrows = obligation.info.borrows.map((b) => {
    const reserveAddress = b.borrowReserve.toBase58();
    const reserve = pool.reserves.find((r) => r.address === reserveAddress);
    if (!reserve)
      throw Error("Borrow in obligation does not exist in the pool");

    const amount = new BigNumber(b.borrowedAmountWads.toString())
      .shiftedBy(-18 - reserve.decimals)
      .times(reserve.cumulativeBorrowRate)
      .dividedBy(
        new BigNumber(b.cumulativeBorrowRateWads.toString()).shiftedBy(-18)
      );
    const amountUsd = amount.times(reserve.price);

    const maxPrice = reserve.emaPrice
      ? BigNumber.max(reserve.emaPrice, reserve.price)
      : reserve.price;

    maxPriceUserTotalWeightedBorrow = maxPriceUserTotalWeightedBorrow.plus(
      amount
        .times(maxPrice)
        .times(reserve.borrowWeight ? reserve.borrowWeight : U64_MAX)
    );

    return {
      liquidationThreshold: reserve.liquidationThreshold,
      loanToValueRatio: reserve.loanToValueRatio,
      symbol: reserve.symbol,
      price: reserve.price,
      reserveAddress,
      mintAddress: reserve.mintAddress,
      borrowWeight: reserve.borrowWeight,
      amount,
      amountUsd,
      weightedAmountUsd: new BigNumber(reserve.borrowWeight).multipliedBy(
        amountUsd
      ),
      annualInterest: amountUsd.multipliedBy(reserve.borrowInterest),
    };
  });

  const totalSupplyValue = deposits.reduce(
    (acc, d) => acc.plus(d.amountUsd),
    new BigNumber(0)
  );
  const totalBorrowValue = borrows.reduce(
    (acc, b) => acc.plus(b.amountUsd),
    new BigNumber(0)
  );
  const weightedTotalBorrowValue = borrows.reduce(
    (acc, b) => acc.plus(b.weightedAmountUsd),
    new BigNumber(0)
  );

  const borrowLimit = deposits.reduce(
    (acc, d) => d.amountUsd.times(d.loanToValueRatio).plus(acc),
    BigNumber(0)
  );
  const liquidationThreshold = deposits.reduce(
    (acc, d) => d.amountUsd.times(d.liquidationThreshold).plus(acc),
    BigNumber(0)
  );
  const netAccountValue = totalSupplyValue.minus(totalBorrowValue);
  const liquidationThresholdFactor = totalSupplyValue.isZero()
    ? new BigNumber(0)
    : liquidationThreshold.dividedBy(totalSupplyValue);
  const borrowLimitFactor = totalSupplyValue.isZero()
    ? new BigNumber(0)
    : borrowLimit.dividedBy(totalSupplyValue);
  const borrowUtilization = borrowLimit.isZero()
    ? new BigNumber(0)
    : totalBorrowValue.dividedBy(borrowLimit);
  const weightedBorrowUtilization = minPriceBorrowLimit.isZero()
    ? new BigNumber(0)
    : weightedTotalBorrowValue.dividedBy(borrowLimit);
  const isBorrowLimitReached = borrowUtilization.isGreaterThanOrEqualTo(
    new BigNumber("1")
  );
  const borrowOverSupply = totalSupplyValue.isZero()
    ? new BigNumber(0)
    : totalBorrowValue.dividedBy(totalSupplyValue);

  const positions =
    obligation.info.deposits.filter((d) => !d.depositedAmount.isZero()).length +
    obligation.info.borrows.filter((b) => !b.borrowedAmountWads.isZero())
      .length;

  const weightedConservativeBorrowUtilization = minPriceBorrowLimit.isZero()
    ? new BigNumber(0)
    : maxPriceUserTotalWeightedBorrow.dividedBy(minPriceBorrowLimit);

  const annualSupplyInterest = deposits.reduce(
    (acc, d) => d.annualInterest.plus(acc),
    new BigNumber(0)
  );
  const annualBorrowInterest = borrows.reduce(
    (acc, b) => b.annualInterest.plus(acc),
    new BigNumber(0)
  );
  const netApy = annualSupplyInterest
    .minus(annualBorrowInterest)
    .div(netAccountValue.toString());
  return {
    address: obligation.pubkey.toBase58(),
    positions,
    deposits,
    borrows,
    poolAddress,
    totalSupplyValue,
    totalBorrowValue,
    borrowLimit,
    liquidationThreshold,
    netAccountValue,
    liquidationThresholdFactor,
    borrowLimitFactor,
    borrowUtilization,
    weightedConservativeBorrowUtilization,
    weightedBorrowUtilization,
    isBorrowLimitReached,
    borrowOverSupply,
    weightedTotalBorrowValue,
    minPriceUserTotalSupply,
    minPriceBorrowLimit,
    maxPriceUserTotalWeightedBorrow,
    netApy,
  };
}

export async function fetchObligationByAddress(
  obligationAddress: string,
  connection: Connection,
  debug?: boolean
) {
  if (debug) console.log("fetchObligationByAddress");

  const rawObligationData = await connection.getAccountInfo(
    new PublicKey(obligationAddress)
  );

  if (!rawObligationData) {
    return null;
  }

  const parsedObligation = parseObligation(
    new PublicKey(obligationAddress),
    rawObligationData!
  );

  if (!parsedObligation) {
    return null;
  }

  return parsedObligation;
}

export async function fetchObligationsByAddress(
  obligationAddresses: Array<string>,
  connection: Connection,
  debug?: boolean
) {
  if (debug)
    console.log("fetchObligationsByAddress", obligationAddresses.length);
  const rawObligations = await getBatchMultipleAccountsInfo(
    obligationAddresses,
    connection
  );

  const parsedObligations = rawObligations
    .map((obligation, index) =>
      obligation
        ? parseObligation(new PublicKey(obligationAddresses[index]), obligation)
        : null
    )
    .filter(Boolean) as Array<{ info: Obligation; pubkey: PublicKey }>;

  return parsedObligations;
}

export async function fetchObligationsByWallet(
  publicKey: PublicKey,
  connection: Connection,
  programId: string,
  debug?: boolean
) {
  if (debug) console.log("fetchObligationsByWallet");

  const filters = [
    { dataSize: OBLIGATION_SIZE },
    { memcmp: { offset: 42, bytes: publicKey.toBase58() } },
  ];

  const rawObligations = await connection.getProgramAccounts(
    new PublicKey(programId),
    {
      commitment: connection.commitment,
      filters,
      encoding: "base64",
    }
  );

  const parsedObligations = rawObligations
    .map((obligation) =>
      obligation ? parseObligation(obligation.pubkey, obligation.account) : null
    )
    .filter(Boolean) as Array<{ info: Obligation; pubkey: PublicKey }>;

  return parsedObligations;
}

export async function fetchObligationsOfPoolByWallet(
  publicKey: PublicKey,
  poolAddress: PublicKey,
  programId: PublicKey,
  connection: Connection,
  debug?: boolean
) {
  if (debug) console.log("fetchObligationsByWallet");

  const filters = [
    { dataSize: OBLIGATION_SIZE },
    { memcmp: { offset: 42, bytes: publicKey.toBase58() } },
    { memcmp: { offset: 10, bytes: poolAddress.toBase58() } },
  ];

  const rawObligations = await connection.getProgramAccounts(programId, {
    commitment: connection.commitment,
    filters,
    encoding: "base64",
  });

  const parsedObligations = rawObligations
    .map((obligation) =>
      obligation ? parseObligation(obligation.pubkey, obligation.account) : null
    )
    .filter(Boolean) as Array<{ info: Obligation; pubkey: PublicKey }>;

  return parsedObligations;
}

function createWithSeedSync(
  fromPublicKey: PublicKey,
  seed: string,
  programId: PublicKey
) {
  const buffer = Buffer.concat([
    fromPublicKey.toBuffer(),
    Buffer.from(seed),
    programId.toBuffer(),
  ]);
  const hash = sha256$1.digest(buffer);
  return new PublicKey(Buffer.from(hash));
}

export function getNthObligationSeed(lendingMarket: PublicKey, n: number) {
  return lendingMarket.toBase58().slice(0, 24) + `0000000${n}m`.slice(-7);
}

export function getObligationAddressWithSeed(
  publicKey: PublicKey,
  seed: string,
  programId: PublicKey
) {
  // <first 25 char of lending market address> + <7 chars: 0000001 - 9999999>
  return createWithSeedSync(publicKey, seed, programId);
}
