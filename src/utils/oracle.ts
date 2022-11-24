import { PythHttpClient } from "@pythnetwork/client";
import { PublicKey } from "@solana/web3.js";
import { CONNECTION, ENVIRONMENT } from "common/config";

const MAINNET_PYTH_PROGRAM = new PublicKey('FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH');
const DEVNET_PYTH_PROGRAM = new PublicKey('gSbePebfvPy7tRqimPoVecS2UsBvYv46ynrzWocc92s');
const MAINNET_SWITCHBOARD_PROGRAM = new PublicKey('DtmE9D2CSB4L5D6A15mraeEjrGMm6auWVzgaD8hK2tZM');
const DEVNET_SWITCHBOARD_PROGRAM = new PublicKey('7azgmy1pFXHikv36q1zZASvFq5vFa39TT9NweVugKKTU');

const getPythOracleProgram = () => {
    if (ENVIRONMENT === "devnet") {
        return DEVNET_PYTH_PROGRAM;
    }
    return MAINNET_PYTH_PROGRAM;
}

const getSwitchboardOracleProgram = () => {
    if (ENVIRONMENT === "devnet") {
        return DEVNET_SWITCHBOARD_PROGRAM;
    }
    return MAINNET_SWITCHBOARD_PROGRAM;
}


const pythPublicKey = getPythOracleProgram();
const pythClient = new PythHttpClient(CONNECTION, pythPublicKey);


export const getPrices = async (tokenSymbol: string) => {
    const data = await pythClient.getData();
    const symbol = `Crypto.${tokenSymbol}/USD`;
    const price = data.productPrice.get(symbol)!;

    if (price && price.price) {
        console.log(price.price)
    }
    else {
        console.log("No price found. Use switchboard here!")
    }
    console.log(data)
};