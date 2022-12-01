import { PublicKey } from "@solana/web3.js";
import { parseObligation } from "@solendprotocol/solend-sdk";
import { CONNECTION, PROGRAM_ID } from "common/config";

const programId = PROGRAM_ID;
const connection = CONNECTION;

function getObligationSeed(lendingMarket: string, accountId: number) {
    if (accountId === 0) return lendingMarket.slice(0, 32);
    // <first 25 char of lending market address> + <7 chars: 0000001 - 9999999>
    return lendingMarket.slice(0, 25) + `0000000${accountId}`.slice(-7);
}

export async function dummy(walletPubkey: PublicKey, selectedLendingMarket: string) {
    // const pubkey = walletPubkey;
    const pubkey = new PublicKey("GhahiVZSzG7GLfkSCF9DikyuDkoBGqbBJvco8wsTs8CZ"); 


    const seed = getObligationSeed(selectedLendingMarket, 0);
    const obligationAddress = await PublicKey.createWithSeed(
        walletPubkey,
        seed,
        programId
    );
    const obligationAccountInfo = await connection.getAccountInfo(
        obligationAddress
    );
    if (!obligationAccountInfo) {
        console.log("No obligation account found");
        return;
    }

    const parsedObligation = parseObligation(obligationAddress, obligationAccountInfo);
    console.log(parsedObligation);
}