import { AccountInfo, GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";
import { parseReserve, Reserve } from "@solendprotocol/solend-sdk";
import BigNumber from "bignumber.js";
import { CONNECTION, PROGRAM_ID } from "common/config";
import { ReserveViewModel, ParsedReserve } from "models/Reserves";
import { getTokensInfo, TokenInfo } from "./tokens";


const RESERVE_LEN = 619;
const programId = PROGRAM_ID;
const connection = CONNECTION;


export async function getReserves(lendingMarketPubkey: PublicKey): Promise<ReserveViewModel[]> {
    const reserves = await getReservesOfPool(lendingMarketPubkey);
    const parsedReserves = reserves.map((reserve) => getParsedReserve(reserve));

    const mints: PublicKey[] = [];
    for (var reserve of parsedReserves) {
        const { info } = reserve;
        mints.push(info.liquidity.mintPubkey);
    }
    const tokens = await getTokensInfo(mints);

    const reserveViewModels = parsedReserves.map((parsedReserve) => getReserveViewModel(parsedReserve, tokens));
    return reserveViewModels;
}

async function getReservesOfPool(lendingMarketPubkey: PublicKey) {
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
}

function getParsedReserve(reserve: {
    pubkey: PublicKey;
    account: AccountInfo<Buffer>;
}): ParsedReserve {
    const ParsedReserve = parseReserve(reserve.pubkey, reserve.account);
    return ParsedReserve;
}

function getReserveViewModel(parsedReserve: ParsedReserve, tokens: { [key: string]: TokenInfo }): ReserveViewModel {
    const { pubkey, info } = parsedReserve;
    const tokenPubkey = info.liquidity.mintPubkey.toBase58();
    const reserveViewModel = {
        address: pubkey.toBase58(),
        tokenSymbol: tokens[tokenPubkey].tokenSymbol,
        logoUri: tokens[tokenPubkey].logoUri,
        priceUSD: getPriceInUSD(), //TODO: get price from oracle
        LTV: getLoanToValueRatio(info),
        totalSupply: getTotalSupply(info),
        totalSupplyUSD: getTotalSupplyUSD(info), //TODO: calculate price from (priceUSD, totalSupply)
        totalBorrow: getTotalBorrow(info),
        totalBorrowUSD: getTotalBorrowUSD(info), //TODO: calculate price from (priceUSD, totalBorrow)
        supplyAPY: getSupplyAPY(), //TODO:
        borrowAPY: getBorrowAPY(), //TODO:
        supplyAPR: getSupplyAPR(), //TODO: calculate from (supplyAPY, totalSupply)
        borrowAPR: getBorrowAPR(), //TODO: calculate from (borrowAPY, totalBorrow)
    }
    return reserveViewModel;
}


function getTotalSupply(reserve: Reserve): string {
    // totalSupply = availableAmount + totalBorrow
    const availableAmountWads = BigNumber(reserve.liquidity.availableAmount.toString()).multipliedBy(BigNumber(10).pow(18));
    const borrowedAmountWads = BigNumber(reserve.liquidity.borrowedAmountWads.toString());
    const supplyAmountWads = availableAmountWads.plus(borrowedAmountWads);
    const decimals = BigNumber(reserve.liquidity.mintDecimals.toString());
    const totalSupply = supplyAmountWads.dividedBy(BigNumber(10).pow(decimals.plus(BigNumber(18))));
    return totalSupply.toFixed(0);
}

function getTotalBorrow(reserve: Reserve): string {
    const borrowedAmountWads = BigNumber(reserve.liquidity.borrowedAmountWads.toString());
    const decimals = BigNumber(reserve.liquidity.mintDecimals.toString());
    const totalBorrow = borrowedAmountWads.dividedBy(BigNumber(10).pow(decimals.plus(BigNumber(18))));
    return totalBorrow.toFixed(0);
}

function getLoanToValueRatio(reserve: Reserve): string {
    const loanToValueRatio = reserve.config.loanToValueRatio.toString();
    return loanToValueRatio + "%";
}



// ----- Dummy

function getPriceInUSD(): string {
    const price = "0.37"
    return "$" + price;
}

function getTotalSupplyUSD(reserve: Reserve): string {
    // const totalSupply = getTotalSupply(reserve);
    // const price = getPriceInUSD();
    // const totalSupplyUSD = BigNumber(totalSupply).multipliedBy(price);
    // return totalSupplyUSD.toFixed(0);
    return "5,447,720";
}

function getTotalBorrowUSD(reserve: Reserve): string {
    // const totalBorrow = getTotalBorrow(reserve);
    // const price = getPriceInUSD();
    // const totalBorrowUSD = BigNumber(totalBorrow).multipliedBy(price);
    // return totalBorrowUSD.toFixed(0);
    return "1,999,999";
}

function getSupplyAPY(): string {
    const supplyAPY = "8.94";
    return supplyAPY + "%";
}

function getBorrowAPY(): string {
    const borrowAPY = "26.12";
    return borrowAPY + "%";
}

function getSupplyAPR(): string {
    const supplyAPR = "0.04";
    return supplyAPR + "%";
}

function getBorrowAPR(): string {
    const borrowAPR = "1.37";
    return borrowAPR + "%";
}

// ----- Dummy