import { GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";
import { getProgramId, Reserve } from "@solendprotocol/solend-sdk";
import BigNumber from "bignumber.js";
import { CONNECTION, ENVIRONMENT } from "common/config";

export interface ReserveViewModel {
    address: string;
    name: string;
    logo: string;
    priceUSD: number;
    LTV: string;
    totalSupply: string;
    totalSupplyUSD: string;
    totalBorrow: string;
    totalBorrowUSD: string;
    supplyAPY: string;
    borrowAPY: string;
    supplyAPR: string;
    borrowAPR: string;
}

const environment = ENVIRONMENT;
const connection = CONNECTION;


export async function getReservesOfAPool(lendingMarketPubkey: PublicKey) {
    const RESERVE_LEN = 619;
    const programId = getProgramId(environment); // production | devnet | beta

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

function getTotalSupply(reserve: Reserve): string {
    const mintTotalSupply = BigNumber(reserve.collateral.mintTotalSupply.toString());
    const decimals = BigNumber(reserve.liquidity.mintDecimals.toString());
    const totalSupply = mintTotalSupply.dividedBy(BigNumber(10).pow(decimals));
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
    return loanToValueRatio;
}


// name
// logo
// priceUSD
// totalSupplyUSD
// totalBorrowUSD
// supplyAPY
// borrowAPY
// supplyAPR
// borrowAPR