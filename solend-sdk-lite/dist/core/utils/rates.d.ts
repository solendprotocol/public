import BigNumber from "bignumber.js";
import { Reserve } from "../../state";
export declare const calculateSupplyInterest: (reserve: Reserve, showApy: boolean) => BigNumber;
export declare const calculateBorrowInterest: (reserve: Reserve, showApy: boolean) => BigNumber;
