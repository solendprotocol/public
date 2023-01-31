import { parsePriceData } from "@pythnetwork/client";
import {
    Connection,
    PublicKey,
} from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { parseReserve, Reserve } from "../../solend-sdk/src/state";
import { LENDING_MARKET_SIZE } from '../../solend-sdk/src/state/lendingMarket'
import { getBatchMultipleAccountsInfo } from "./common";
import SwitchboardProgram from '@switchboard-xyz/sbv2-lite';
import { PROGRAM_ID, SLOTS_PER_YEAR, SOLEND_ADDRESSES } from "./config";

const SBV2_MAINNET = 'SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f';

export const getPoolsFromChain = async (connection: Connection) => {
    const filters = [
        { dataSize: LENDING_MARKET_SIZE },
        { memcmp: { offset: 2, bytes: SOLEND_ADDRESSES[0] } },
    ];

    const pools = await connection.getProgramAccounts(PROGRAM_ID, {
        commitment: connection.commitment,
        filters,
        encoding: "base64",
    });

    const poolList = pools.map((pool) => {
        const Pool = {
            address: pool.pubkey.toBase58(),
        };
        return Pool;
    });

    return poolList.map(p => p.address).sort().map(key => ({
        name: null,
        address: key
    }));
};

function formatReserve(reserve: {
    pubkey: PublicKey,
    info: Reserve,
}, price: number | null) {
    const decimals = reserve.info.liquidity.mintDecimals;
    const totalBorrow = new BigNumber(reserve.info.liquidity.borrowedAmountWads.toString()).shiftedBy(-18 - decimals);
    const totalSupply = totalBorrow.plus(reserve.info.liquidity.availableAmount.toString()).shiftedBy(-decimals);
    const address = reserve.pubkey.toBase58();

    return {
        supplyInterest: calculateSupplyInterest(reserve.info, false),
        borrowInterest: calculateBorrowInterest(reserve.info, false),
        totalSupply,
        totalBorrow,
        loanToValueRatio: reserve.info.config.loanToValueRatio / 100,
        address,
        mintAddress: reserve.info.liquidity.mintPubkey.toBase58(),
        decimals,
        price: price ? BigNumber(price) : new BigNumber(reserve.info.liquidity.marketPrice.toString()).shiftedBy(-18),
        poolAddress: reserve.info.lendingMarket.toBase58(),
        pythOracle: reserve.info.liquidity.pythOracle.toBase58(),
        switchboardOracle: reserve.info.liquidity.switchboardOracle.toBase58(),
    }
}

export const getReservesOfPool = async (lendingMarketPubkey: PublicKey, connection: Connection, switchboardProgram: SwitchboardProgram) => {
    const filters = [
        { dataSize: 619 },
        { memcmp: { offset: 10, bytes: lendingMarketPubkey.toBase58() } },
    ];

    const rawReserves = await connection.getProgramAccounts(PROGRAM_ID, {
        commitment: connection.commitment,
        filters,
        encoding: "base64",
    });

    const parsedReserves = rawReserves.map((reserve, index) => reserve ? parseReserve(
        rawReserves[index].pubkey,
        reserve.account
    ): null).filter(Boolean) as Array<{info: Reserve, pubkey: PublicKey}>;

    const prices = await getPrices(parsedReserves, connection, switchboardProgram)
    return parsedReserves.map((r) => formatReserve(r, prices[r.pubkey.toBase58()])).sort();
};

async function getPrices(parsedReserves: Array<{info: Reserve, pubkey: PublicKey}>, connection: Connection, switchboardProgram: SwitchboardProgram) {
    const oracles = parsedReserves.map((reserve) => reserve.info.liquidity.pythOracle)
        .concat(parsedReserves.map((reserve) => reserve.info.liquidity.switchboardOracle));

    const priceAccounts = await getBatchMultipleAccountsInfo(oracles, connection)

    return parsedReserves.reduce((acc, reserve, i) => {
    const pythOracleData = priceAccounts[i];
    const switchboardOracleData = priceAccounts[parsedReserves.length + i];

    let priceData: number | undefined;

    if (pythOracleData) {
      const { price, previousPrice } = parsePriceData(
        pythOracleData.data as Buffer,
      );

      if (price || previousPrice) {
        // use latest price if available otherwise fallback to previoius
        priceData = price || previousPrice;
      }
    }

    // Only attempt to fetch from switchboard if not already available from pyth
    if (!priceData) {
      const rawSb = switchboardOracleData;
      const switchboardData = (switchboardOracleData?.data as Buffer)?.slice(
        1,
      );
      if (rawSb && switchboardData) {
        const owner = rawSb.owner.toString();
        if (owner === SBV2_MAINNET) {
            const result = switchboardProgram.decodeLatestAggregatorValue(
              rawSb!,
            );

            priceData = result?.toNumber();
        }
      }
    }

    return {
      ...acc,
      [reserve.pubkey.toBase58()]: priceData,
    };
  }, {}) as {[address: string]: number};

}

export const getReservesFromChain = async (connection: Connection, switchboardProgram: SwitchboardProgram) => {
    const filters = [
        { dataSize: 619 },
    ];

    const rawReserves = await connection.getProgramAccounts(PROGRAM_ID, {
        commitment: connection.commitment,
        filters,
        encoding: "base64",
    });

    const parsedReserves = rawReserves.map((reserve, index) => reserve ? parseReserve(
        rawReserves[index].pubkey,
        reserve.account
    ): null).filter(Boolean) as Array<{info: Reserve, pubkey: PublicKey}>;

    const prices = await getPrices(parsedReserves, connection, switchboardProgram)
    return parsedReserves.map((r) => formatReserve(r, prices[r.pubkey.toBase58()])).sort();
};


const calculateSupplyAPR = (reserve: Reserve) => {
    const currentUtilization = calculateUtilizationRatio(reserve);
  
    const borrowAPR = calculateBorrowAPR(reserve);
    const protocolTakePercentage = BigNumber(1).minus(reserve.config.protocolTakeRate/100)
  
    return currentUtilization.times(borrowAPR).times(protocolTakePercentage)
  };
  
  const calculateUtilizationRatio = (reserve: Reserve) => {
    const borrowedAmount = new BigNumber(
      reserve.liquidity.borrowedAmountWads.toString()
    ).shiftedBy(-18);
    const totalSupply = borrowedAmount.plus(reserve.liquidity.availableAmount.toString())
    const currentUtilization = borrowedAmount.dividedBy(totalSupply);
  
    return currentUtilization
  };
  
  const calculateBorrowAPR = (reserve: Reserve) => {
    const currentUtilization = calculateUtilizationRatio(reserve);
    const optimalUtilization = new BigNumber(reserve.config.optimalUtilizationRate / 100);
  
    let borrowAPR;
    if (optimalUtilization.isEqualTo(1) || currentUtilization.isLessThan(optimalUtilization)) {
      const normalizedFactor = currentUtilization.dividedBy(optimalUtilization);
      const optimalBorrowRate = new BigNumber(reserve.config.optimalBorrowRate / 100);
      const minBorrowRate = new BigNumber(reserve.config.minBorrowRate / 100);
      borrowAPR =
        normalizedFactor.times(optimalBorrowRate.minus(minBorrowRate)).plus(minBorrowRate);
    } else {
      if (reserve.config.optimalBorrowRate === reserve.config.maxBorrowRate) {
        return new BigNumber(computeExtremeRates(
          (reserve.config.maxBorrowRate / 100).toString(),
        ));
      }
      const normalizedFactor = currentUtilization.minus(optimalUtilization).dividedBy(new BigNumber(1).minus(optimalUtilization));
      const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
      const maxBorrowRate = reserve.config.maxBorrowRate / 100;
      borrowAPR = normalizedFactor.times(maxBorrowRate - optimalBorrowRate).plus(optimalBorrowRate)
    }
  
    return borrowAPR;
  };
  
  const calculateSupplyAPY = (reserve: Reserve) => {
    const apr = calculateSupplyAPR(reserve);
    const apy =
      new BigNumber(1)
        .plus(new BigNumber(apr).dividedBy(SLOTS_PER_YEAR))
        .toNumber() **
        SLOTS_PER_YEAR -
      1;
    return new BigNumber(apy);
  };
  
  const calculateBorrowAPY = (reserve: Reserve) => {
    const apr = calculateBorrowAPR(reserve);
    const apy =
      new BigNumber(1)
        .plus(new BigNumber(apr).dividedBy(SLOTS_PER_YEAR))
        .toNumber() **
        SLOTS_PER_YEAR -
      1;
    return new BigNumber(apy);
  };
  
  const calculateSupplyInterest = (reserve: Reserve, showApy: boolean) =>
    showApy ? calculateSupplyAPY(reserve) : calculateSupplyAPR(reserve);
  
  const calculateBorrowInterest = (reserve: Reserve, showApy: boolean) =>
    showApy ? calculateBorrowAPY(reserve) : calculateBorrowAPR(reserve);
  
function computeExtremeRates(configRate: string) {
    let numRate = Number(configRate);
    const rate = 0.5;
    
    if (numRate >= 2.47) {
        numRate = Number(configRate.replace('.', ''));
    }
    
    switch (numRate) {
        case 251:
        return rate * 6;
        case 252:
        return rate * 7;
        case 253:
        return rate * 8;
        case 254:
        return rate * 10;
        case 255:
        return rate * 12;
        case 250:
        return rate * 20;
        case 249:
        return rate * 30;
        case 248:
        return rate * 40;
        case 247:
        return rate * 50;
        default:
        return numRate;
    }
    }