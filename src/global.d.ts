interface PoolViewModel {
    name?: string;
    address: string;
}

interface ReserveViewModel {
    address: string;
    tokenSymbol: string;
    logoUri: string | null;
    assetPriceUSD: string;
    totalSupply: BigNumber;
    totalBorrow: BigNumber;
    LTV: number;
    supplyAPY: number;
    borrowAPY: number;
    supplyAPR: number;
    borrowAPR: number;
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

interface TokenInfo {
    tokenSymbol: string;
    logoUri: string | null;
}