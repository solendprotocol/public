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
        borrowAPY: getBorrowAPY(info), //TODO:
        supplyAPR: getSupplyAPR(), //TODO: calculate from (supplyAPY, totalSupply)
        borrowAPR: calculateBorrowAPR(info),
    }
    return reserveViewModel;
}


function getTotalSupply(reserve: Reserve): string {
    const supplyAmountWads = calculateSupplyAmountWads(reserve);
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
    return "5,447,720";
}

function getTotalBorrowUSD(reserve: Reserve): string {
    return "1,999,999";
}

function getSupplyAPY(): string {
    const supplyAPY = "8.94";
    return supplyAPY + "%";
}

// FIXME: implement this function
function getBorrowAPY(reserve: Reserve): string {
    return calculateBorrowAPR(reserve) + "%";
}

function getSupplyAPR(): string {
    const supplyAPR = "0.04";
    return supplyAPR + "%";
}

// ----- Dummy



const calculateBorrowAPR = (reserve: Reserve) => {
    const currentUtilization = calculateUtilizationRatio(reserve);
    const optimalUtilization = reserve.config.optimalUtilizationRate / 100;

    let borrowAPR: number;
    if (optimalUtilization === 1.0 || currentUtilization < optimalUtilization) {
        const normalizedFactor = currentUtilization / optimalUtilization;
        const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
        const minBorrowRate = reserve.config.minBorrowRate / 100;
        borrowAPR =
            normalizedFactor * (optimalBorrowRate - minBorrowRate) + minBorrowRate;
    } else {
        if (reserve.config.optimalBorrowRate === reserve.config.maxBorrowRate) {
            return computeExtremeRates(
                (reserve.config.maxBorrowRate / 100).toString(),
            );
        }
        const normalizedFactor =
            (currentUtilization - optimalUtilization) / (1 - optimalUtilization);
        const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
        const maxBorrowRate = reserve.config.maxBorrowRate / 100;
        borrowAPR =
            normalizedFactor * (maxBorrowRate - optimalBorrowRate) +
            optimalBorrowRate;
    }

    // TODO: handle this later
    return borrowAPR * 100;
};

const calculateUtilizationRatio = (reserve: Reserve) => {
    const borrowedAmountWads = BigNumber(reserve.liquidity.borrowedAmountWads.toString());
    const supplyAmountWads = calculateSupplyAmountWads(reserve);
    const currentUtilization = borrowedAmountWads.dividedBy(supplyAmountWads);
    return parseFloat(currentUtilization.toString());
};

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

function calculateSupplyAmountWads(reserve: Reserve) {
    const availableAmountWads = BigNumber(reserve.liquidity.availableAmount.toString()).multipliedBy(BigNumber(10).pow(18));
    const borrowedAmountWads = BigNumber(reserve.liquidity.borrowedAmountWads.toString());
    const supplyAmountWads = availableAmountWads.plus(borrowedAmountWads);
    return supplyAmountWads;
}