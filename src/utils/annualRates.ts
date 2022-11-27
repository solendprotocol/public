import { Reserve } from "@solendprotocol/solend-sdk/dist/state/reserve";
import BigNumber from "bignumber.js";


const SLOTS_PER_YEAR = 63072000;

export const calculateAPY = (apr: number | BigNumber) => {
    // APY = [1 + (APR / Number of Periods)] ** (Number of Periods) - 1
    const x = BigNumber(apr).dividedBy(BigNumber(SLOTS_PER_YEAR)).toNumber();
    const apy = (1 + x) ** SLOTS_PER_YEAR - 1;
    return apy;
};

export function calculateSupplyAmountWads(reserve: Reserve) {
    const availableAmountWads = BigNumber(reserve.liquidity.availableAmount.toString()).multipliedBy(BigNumber(10).pow(18));
    const borrowedAmountWads = BigNumber(reserve.liquidity.borrowedAmountWads.toString());
    const supplyAmountWads = availableAmountWads.plus(borrowedAmountWads);
    return supplyAmountWads;
};


const calculateUtilizationRatio = (reserve: Reserve) => {
    const borrowedAmountWads = BigNumber(reserve.liquidity.borrowedAmountWads.toString());
    const supplyAmountWads = calculateSupplyAmountWads(reserve);
    const currentUtilization = borrowedAmountWads.dividedBy(supplyAmountWads);
    return parseFloat(currentUtilization.toString());
};

export const calculateSupplyAPR = (reserve: Reserve) => {
    const currentUtilization = calculateUtilizationRatio(reserve);
    const borrowAPR = calculateBorrowAPR(reserve);
    return (
        currentUtilization * borrowAPR * (1 - reserve.config.protocolTakeRate / 100)
    );
};


export const calculateBorrowAPR = (reserve: Reserve) => {
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
};
