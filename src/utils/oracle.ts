import { parsePriceData, PythHttpClient } from "@pythnetwork/client";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import { CONNECTION } from "common/config";

const connection = CONNECTION;

// const MAINNET_PYTH_PROGRAM = new PublicKey('FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH');
// const DEVNET_PYTH_PROGRAM = new PublicKey('gSbePebfvPy7tRqimPoVecS2UsBvYv46ynrzWocc92s');
// const MAINNET_SWITCHBOARD_PROGRAM = new PublicKey('DtmE9D2CSB4L5D6A15mraeEjrGMm6auWVzgaD8hK2tZM');
// const DEVNET_SWITCHBOARD_PROGRAM = new PublicKey('7azgmy1pFXHikv36q1zZASvFq5vFa39TT9NweVugKKTU');

// const getPythOracleProgram = () => {
//     if (ENVIRONMENT === "devnet") {
//         return DEVNET_PYTH_PROGRAM;
//     }
//     return MAINNET_PYTH_PROGRAM;
// }

// const getSwitchboardOracleProgram = () => {
//     if (ENVIRONMENT === "devnet") {
//         return DEVNET_SWITCHBOARD_PROGRAM;
//     }
//     return MAINNET_SWITCHBOARD_PROGRAM;
// }

// const pythPublicKey = getPythOracleProgram();
// const switchboardPublicKey = getSwitchboardOracleProgram();



export const getOracleAddresses = (parsedReserves: ParsedReserve[]) => {
    const oracles = new Map<string, { pyth: string, sb: string }>();
    parsedReserves.forEach((reserve) => {
        const reservePubkey = reserve.pubkey.toBase58();
        const pyth = reserve.info.liquidity.pythOracle.toBase58();
        const sb = reserve.info.liquidity.switchboardOracle.toBase58();
        oracles.set(reservePubkey, { pyth, sb });
    });
    return oracles;
}


export const getPriceFromPyth = (accountInfo: AccountInfo<Buffer> | null) => {
    if (!accountInfo) {
        throw new Error("Failed to get price account info");
    }
    const priceData = parsePriceData(accountInfo.data);
    if (!priceData || !priceData.price) {
        throw new Error("Failed to parse price data");
    }
    return priceData.price;
};


export const getPythAccountsInfo = async (oracles: Map<string, { pyth: string, sb: string }>) => {
    const accountsInfo = new Map<string, AccountInfo<Buffer> | null>();
    const promises = new Set<Promise<void>>();

    const setAccountsInfo = async (reserveAddress: string, pythAddress: string) => {
        const pythAccountInfo = await connection.getAccountInfo(new PublicKey(pythAddress));
        accountsInfo.set(reserveAddress, pythAccountInfo);
    };
    
    for (const [reserveAddress, { pyth }] of oracles) {
        promises.add(setAccountsInfo(reserveAddress, pyth));
    }
    await Promise.all(promises);
    return accountsInfo;
};