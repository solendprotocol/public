/// <reference types="node" />
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
export declare function sighash(nameSpace: string, ixName: string): Buffer;
export declare const MINT_BASIS = "Basis9oJw9j8cw53oMV7iqsgo6ihi9ALw4QR31rcjUJa";
export declare const MINT_RBASIS = "rBsH9ME52axhqSjAVXY3t1xcCrmntVNvP3X16pRjVdM";
export declare const PROGRAM_BASIS_STAKING = "FTH1V7jAETZfDgHiL4hJudKXtV8tqKN1WEnkyY4kNAAC";
export declare const PROGRAM_BASIS_STAKING_INSTANCE = "HXCJ1tWowNNNUSrtoVnxT3y9ue1tkuaLNbFMM239zm1y";
export declare const PROGRAM_BASIS_STAKING_VAULT = "3sBX8hj4URsiBCSRV26fEHkake295fQnM44EYKKsSs51";
export declare const unstakeBasisInstruction: (amount: number | BN | string, userAuthority: PublicKey, userToken: PublicKey, userRedeemable: PublicKey) => TransactionInstruction;
