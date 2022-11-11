import { AccountInfo, GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";
import { getProgramId, parseReserve, Reserve } from "@solendprotocol/solend-sdk";
import BigNumber from "bignumber.js";
import { CONNECTION, ENVIRONMENT } from "common/config";

export interface ReserveViewModel {
    address: string;
    name: string;
    logo: string;
    priceUSD: string;
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

interface ParsedReserve {
    pubkey: PublicKey;
    account: {
        executable: boolean;
        owner: PublicKey;
        lamports: number;
        data: Buffer;
        rentEpoch?: number | undefined;
    };
    info: Reserve;
}


const RESERVE_LEN = 619;
const environment = ENVIRONMENT;
const connection = CONNECTION;


export async function getReserves(lendingMarketPubkey: PublicKey): Promise<ReserveViewModel[]> {
    const reserves = await getReservesOfPool(lendingMarketPubkey);
    const parsedReserves = reserves.map((reserve) => getParsedReserve(reserve));
    const reserveViewModels = parsedReserves.map((parsedReserve) => getReserveViewModel(parsedReserve));
    return reserveViewModels;
}

async function getReservesOfPool(lendingMarketPubkey: PublicKey) {
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

function getParsedReserve(reserve: {
    pubkey: PublicKey;
    account: AccountInfo<Buffer>;
}): ParsedReserve {
    const ParsedReserve = parseReserve(reserve.pubkey, reserve.account);
    return ParsedReserve;
}

function getReserveViewModel(parsedReserve: ParsedReserve): ReserveViewModel {
    const { pubkey, account, info } = parsedReserve;
    const reserveViewModel = {
        address: pubkey.toBase58(),
        name: getReserveName(), //TODO:
        logo: getReserveLogo(), //TODO:
        priceUSD: getPriceInUSD(), //TODO:
        LTV: getLoanToValueRatio(info),
        totalSupply: getTotalSupply(info),
        totalSupplyUSD: getTotalSupplyUSD(info), //TODO:
        totalBorrow: getTotalBorrow(info),
        totalBorrowUSD: getTotalBorrowUSD(info), //TODO:
        supplyAPY: getSupplyAPY(), //TODO:
        borrowAPY: getBorrowAPY(), //TODO:
        supplyAPR: getSupplyAPR(), //TODO:
        borrowAPR: getBorrowAPR(), //TODO:
    }
    return reserveViewModel;
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
    return loanToValueRatio + "%";
}



// ----- Dummy

function getReserveName(): string | null {
    return "SLND";
    // return null;
}

function getReserveLogo(): string {
    return "logo_url";
}

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
