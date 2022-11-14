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
        assetPriceUSD: getPriceInUSD(), //TODO: get price from oracle
        LTV: getLoanToValueRatio(info),
        totalSupply: getTotalSupply(info),
        totalBorrow: getTotalBorrow(info),
        supplyAPY: calculateSupplyAPY(info),
        borrowAPY: calculateBorrowAPY(info),
        supplyAPR: calculateSupplyAPR(info), // depends on calculateBorrowAPR
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



// FIXME: Dummy function
function getPriceInUSD(): string {
    const price = "0.37"
    return "$" + price;
}



const SLOTS_PER_YEAR = 63072000;

const calculateSupplyAPY = (reserve: Reserve) => {
    // APY = [1 + (APR / Number of Periods)] ** (Number of Periods) - 1
    const apr = calculateSupplyAPR(reserve);
    const x = BigNumber(apr).dividedBy(BigNumber(SLOTS_PER_YEAR)).toNumber();
    const apy = (1 + x) ** SLOTS_PER_YEAR - 1;
    return apy.toString();
};

const calculateBorrowAPY = (reserve: Reserve) => {
    // APY = [1 + (APR / Number of Periods)] ** (Number of Periods) - 1
    const apr = calculateBorrowAPR(reserve);
    const x = BigNumber(apr).dividedBy(BigNumber(SLOTS_PER_YEAR)).toNumber();
    const apy = (1 + x) ** SLOTS_PER_YEAR - 1;
    return apy.toString();
};

const calculateSupplyAPR = (reserve: Reserve) => {
    const currentUtilization = calculateUtilizationRatio(reserve);
    const borrowAPR = calculateBorrowAPR(reserve);
    return (
        currentUtilization * borrowAPR * (1 - reserve.config.protocolTakeRate / 100)
    );
};


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

    return borrowAPR;
};

const calculateUtilizationRatio = (reserve: Reserve) => {
    const borrowedAmountWads = BigNumber(reserve.liquidity.borrowedAmountWads.toString());
    const supplyAmountWads = calculateSupplyAmountWads(reserve);
    const currentUtilization = borrowedAmountWads.dividedBy(supplyAmountWads);
    return parseFloat(currentUtilization.toString());
};

function calculateSupplyAmountWads(reserve: Reserve) {
    const availableAmountWads = BigNumber(reserve.liquidity.availableAmount.toString()).multipliedBy(BigNumber(10).pow(18));
    const borrowedAmountWads = BigNumber(reserve.liquidity.borrowedAmountWads.toString());
    const supplyAmountWads = availableAmountWads.plus(borrowedAmountWads);
    return supplyAmountWads;
}

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

