import { AccountInfo, Connection, GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";
import { parseReserve, Reserve } from "@solendprotocol/solend-sdk/dist/state/reserve";
import SwitchboardProgram from "@switchboard-xyz/sbv2-lite";
import BigNumber from "bignumber.js";
import {
    PROGRAM_ID,
    MAIN_POOL_ADDRESS,
    MAIN_POOL_RESERVES_ADDRESSES
} from "common/config";
import {
    calculateAPY,
    calculateSupplyAPR,
    calculateBorrowAPR,
    calculateSupplyAmountWads
} from "./annualRates";
import { getAssetPrices, getOracleAddresses } from "./assetPrices";
import { getTokensInfo } from "./tokens";


const RESERVE_LEN = 619;
const programId = PROGRAM_ID;

export const getReserves = async (
    lendingMarketPubkey: PublicKey,
    connection: Connection,
    sbv2: SwitchboardProgram)
    : Promise<ReserveViewModel[]> => {

    let reserves = await getReservesOfPool(lendingMarketPubkey, connection);
    // hardcode the reserves order for main pool
    if (lendingMarketPubkey.toBase58() === MAIN_POOL_ADDRESS) {
        reserves = reorderMainPoolReserves(reserves);
    }
    const parsedReserves = reserves.map((reserve) => getParsedReserve(reserve));

    const oracles = getOracleAddresses(parsedReserves);
    const oraclePrices = await getAssetPrices(oracles, sbv2);

    const mints: PublicKey[] = [];
    parsedReserves.map((reserve) => { mints.push(reserve.info.liquidity.mintPubkey) });
    const tokens = await getTokensInfo(mints);

    const reserveViewModels = parsedReserves.map((parsedReserve) =>
        getReserveViewModel(parsedReserve, tokens, oraclePrices)
    );
    return reserveViewModels;
};


const getReservesOfPool = async (lendingMarketPubkey: PublicKey, connection: Connection) => {
    const filters: GetProgramAccountsFilter[] = [
        { dataSize: RESERVE_LEN },
        { memcmp: { offset: 10, bytes: lendingMarketPubkey.toBase58() } },
    ];
    const reserves = await connection.getProgramAccounts(programId, {
        commitment: connection.commitment,
        filters,
        encoding: "base64",
    });
    return reserves;
};


const getParsedReserve = (reserve: { pubkey: PublicKey; account: AccountInfo<Buffer> }) => {
    const ParsedReserve = parseReserve(reserve.pubkey, reserve.account);
    if (!ParsedReserve) {
        throw new Error("Failed to parse reserve");
    }
    return ParsedReserve;
};


const getReserveViewModel = (
    parsedReserve: ParsedReserve,
    tokens: Map<string, TokenInfo>,
    oraclePrices: Map<string, number>) => {

    const { pubkey, info } = parsedReserve;
    const tokenPubkey = info.liquidity.mintPubkey.toBase58();
    const [supplyAPR, borrowAPR] = [calculateSupplyAPR(info), calculateBorrowAPR(info)];
    const [supplyAPY, borrowAPY] = [calculateAPY(supplyAPR), calculateAPY(borrowAPR)];

    let tokenInfo = tokens.get(tokenPubkey);
    if (!tokenInfo) {
        tokenInfo = {
            tokenSymbol: `${tokenPubkey.slice(0, 4)}...${tokenPubkey.slice(-4)}`,
            logoUri: null
        } as TokenInfo;
    }

    const reserveViewModel = {
        address: pubkey.toBase58(),
        tokenSymbol: tokenInfo.tokenSymbol,
        logoUri: tokenInfo.logoUri,
        assetPriceUSD: oraclePrices.get(pubkey.toBase58()) || 0,
        totalSupply: calculateTotalSuppliedAmount(info),
        totalBorrow: calculateTotalBorrowedAmount(info),
        LTV: calculateLoanToValueRatio(info),
        supplyAPY: supplyAPY,
        borrowAPY: borrowAPY,
        supplyAPR: supplyAPR,
        borrowAPR: borrowAPR,
    };
    return reserveViewModel;
};


const calculateTotalSuppliedAmount = (reserve: Reserve) => {
    const supplyAmountWads = calculateSupplyAmountWads(reserve);
    const decimals = BigNumber(reserve.liquidity.mintDecimals.toString());
    const totalSupply = supplyAmountWads.dividedBy(BigNumber(10).pow(decimals.plus(BigNumber(18))));
    return totalSupply;
};


const calculateTotalBorrowedAmount = (reserve: Reserve) => {
    const borrowedAmountWads = BigNumber(reserve.liquidity.borrowedAmountWads.toString());
    const decimals = BigNumber(reserve.liquidity.mintDecimals.toString());
    const totalBorrow = borrowedAmountWads.dividedBy(BigNumber(10).pow(decimals.plus(BigNumber(18))));
    return totalBorrow;
};


const calculateLoanToValueRatio = (reserve: Reserve) => {
    const loanToValueRatio = reserve.config.loanToValueRatio;
    return loanToValueRatio;
};


const reorderMainPoolReserves = (reserves: { pubkey: PublicKey; account: AccountInfo<Buffer> }[]) => {
    const reservesMap = new Map<string, { pubkey: PublicKey; account: AccountInfo<Buffer> }>();
    reserves.forEach((reserve) => { reservesMap.set(reserve.pubkey.toBase58(), reserve) });

    let reorderedReserves: { pubkey: PublicKey; account: AccountInfo<Buffer> }[] = [];
    MAIN_POOL_RESERVES_ADDRESSES.forEach((reserveAddress) => {
        const reserve = reservesMap.get(reserveAddress);
        if (reserve) {
            reorderedReserves = [...reorderedReserves, reserve];
        }
    });
    return reorderedReserves;
}

