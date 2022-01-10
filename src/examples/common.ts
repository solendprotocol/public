import legacyConfig from "./production.json";
import BN from "bn.js";
import { find } from "lodash";

export function getReserveInfo(symbol: string) {
  const solendInfo = legacyConfig;
  const tokenInfo = solendInfo.assets.find((ass) => ass.symbol === symbol);
  if (!tokenInfo) {
    throw new Error(`Could not find token info for ${symbol}.`);
  }
  const reserveInfo = solendInfo.markets
    ?.find((mar) => mar.name === "main")
    ?.reserves.find((ass) => ass.asset === symbol);

  if (!reserveInfo) {
    throw new Error(`Could not find ${symbol} in main market.`);
  }

  const oracleInfo = solendInfo.oracles.assets.find(
    (ass) => ass.asset === symbol
  );
  if (!oracleInfo) {
    throw new Error(`Could not find oracle info for ${symbol}.`);
  }

  return {
    ...tokenInfo,
    ...reserveInfo,
    ...oracleInfo,
  };
}

export const U64_MAX = "18446744073709551615";
export const WAD = new BN(`1${"".padEnd(18, "0")}`);

export class BNumber {
  significand: string;

  precision: number;

  constructor(significand: string | number, precision?: number) {
    const stringSig = safeToString(significand);
    const isNeg = stringSig[0] === "-";
    const unsignedStringSig = stringSig.replace("-", "");
    if (!precision || unsignedStringSig.indexOf(".") !== -1) {
      this.significand = `${isNeg ? "-" : ""}${unsignedStringSig
        .split(".")
        .join("")}`;
      this.precision =
        unsignedStringSig.indexOf(".") === -1
          ? 0
          : unsignedStringSig.length - unsignedStringSig.indexOf(".") - 1;
    } else {
      this.significand = `${isNeg ? "-" : ""}${unsignedStringSig}`;
      this.precision = precision;
    }
  }

  isZero() {
    return new BN(this.significand).eq(new BN("0"));
  }

  isNan() {
    return this.precision < 0;
  }

  toString() {
    return this.significand;
  }

  toHuman() {
    return toHumanDec(this.significand, this.precision);
  }

  neg() {
    return neg(this);
  }

  isGreaterThanOrEqualTo(value: BNumber) {
    const [paddedThis, paddedValue] = equalPadding(this, value);

    return new BN(paddedThis).gte(new BN(paddedValue));
  }

  isGreaterThan(value: BNumber) {
    const [paddedThis, paddedValue] = equalPadding(this, value);

    return new BN(paddedThis).gt(new BN(paddedValue));
  }

  isEqualTo(value: BNumber) {
    const [paddedThis, paddedValue] = equalPadding(this, value);

    return new BN(paddedThis).eq(new BN(paddedValue));
  }

  isLessThanOrEqualTo(value: BNumber) {
    const [paddedThis, paddedValue] = equalPadding(this, value);

    return new BN(paddedThis).lte(new BN(paddedValue));
  }

  isLessThan(value: BNumber) {
    const [paddedThis, paddedValue] = equalPadding(this, value);

    return new BN(paddedThis).lt(new BN(paddedValue));
  }

  add(addend: BNumber) {
    return add(this, addend);
  }

  subtract(subtrahend: BNumber) {
    return subtract(this, subtrahend);
  }

  multiply(multiplier: BNumber) {
    return multiply(this, multiplier);
  }

  divideBy(divisor: BNumber) {
    return divide(this, divisor);
  }

  max(value: BNumber) {
    return max(this, value);
  }

  min(value: BNumber) {
    return min(this, value);
  }

  fromWads() {
    return this.divideBy(BWAD);
  }

  fromRays() {
    return this.divideBy(BRAY);
  }

  fromWangs() {
    return this.divideBy(BWANG);
  }
}

export const BWAD = new BNumber("1".concat(Array(18 + 1).join("0")));
export const BRAY = new BNumber("1".concat(Array(27 + 1).join("0")));
export const BWANG = new BNumber("1".concat(Array(36 + 1).join("0")));
export const BNaN = new BNumber("0", -1);
export const BZero = new BNumber("0", 0);

// Returns token info from ASSETS config
export function getTokenInfo(symbol: string) {
  const solendInfo = legacyConfig;
  const tokenInfo = find(solendInfo.assets, { symbol });
  if (!tokenInfo) {
    throw new Error(`Could not find ${symbol} in ASSETS`);
  }
  return tokenInfo;
}

// Converts amount to human (rebase with decimals)
export function toHuman(amount: string, symbol: string) {
  const decimals = getDecimals(symbol);
  return toHumanDec(amount, decimals);
}

export function toBaseUnit(amount: string, symbol: string) {
  if (amount === U64_MAX) return amount;
  const decimals = getDecimals(symbol);
  return toBaseUnitDec(amount, decimals);
}

function toHumanDec(amount: string, decimals: number) {
  const isNeg = amount[0] === "-";
  return `${isNeg ? "-" : ""}${toHumanDecUnsigned(
    amount.replace("-", ""),
    decimals
  )}`;
}

function toHumanDecUnsigned(amount: string, decimals: number) {
  let amountStr = amount.slice(
    amount.length - Math.min(decimals, amount.length)
  );
  if (decimals > amount.length) {
    for (let i = 0; i < decimals - amount.length; i += 1) {
      amountStr = `0${amountStr}`;
    }
    amountStr = `0.${amountStr}`;
  } else {
    amountStr = `.${amountStr}`;
    for (let i = amount.length - decimals - 1; i >= 0; i -= 1) {
      amountStr = amount[i] + amountStr;
    }
    if (amountStr[0] === ".") {
      amountStr = `0${amountStr}`;
    }
  }
  amountStr = stripEnd(amountStr, "0");
  amountStr = stripEnd(amountStr, ".");
  return amountStr;
}

function toBaseUnitDec(amount: string, decimals: number) {
  const isNeg = amount[0] === "-";
  return `${isNeg ? "-" : ""}${toBaseUnitDecUnsigned(
    amount.replace("-", ""),
    decimals
  )}`;
}

// Converts to base unit amount
// e.g. 1.0 SOL => 1000000000 (lamports)
function toBaseUnitDecUnsigned(amount: string, decimals: number) {
  if (decimals < 0) {
    throw new Error(`Invalid decimal ${decimals}`);
  }
  if ((amount.match(/\./g) || []).length > 1) {
    throw new Error("Too many decimal points");
  }
  let decimalIndex = amount.indexOf(".");
  let precision;
  if (decimalIndex === -1) {
    precision = 0;
    decimalIndex = amount.length; // Pretend it's at the end
  } else {
    precision = amount.length - decimalIndex - 1;
  }
  if (precision === decimals) {
    return amount.slice(0, decimalIndex) + amount.slice(decimalIndex + 1);
  }
  if (precision < decimals) {
    const numTrailingZeros = decimals - precision;
    return (
      amount.slice(0, decimalIndex) +
      amount.slice(decimalIndex + 1) +
      "".padEnd(numTrailingZeros, "0")
    );
  }
  return (
    amount.slice(0, decimalIndex) +
    amount.slice(decimalIndex + 1, decimalIndex + decimals + 1)
  );
}

export function getDecimals(symbol: string) {
  const tokenInfo = getTokenInfo(symbol);
  return tokenInfo.decimals;
}

// Strips character c from end of string s
function stripEnd(s: string, c: string) {
  let i = s.length - 1;
  for (; i >= 0; i -= 1) {
    if (s[i] !== c) {
      break;
    }
  }
  return s.slice(0, i + 1);
}

export function cTokenToToken(
  supplyAmount: string,
  totalLiquidityWads: string,
  mintSupplyWads: string,
  decimals: number
) {
  if (new BN(mintSupplyWads) === new BN("0")) {
    return supplyAmount;
  }
  return toHumanDec(
    new BN(toBaseUnitDec(supplyAmount, decimals))
      .mul(new BN(totalLiquidityWads))
      .divRound(new BN(mintSupplyWads))
      .toString(),
    decimals
  );
}

export function tokenToCToken(
  supplyAmount: string,
  totalLiquidityWads: string,
  mintSupplyWads: string,
  decimals: number
) {
  if (new BN(mintSupplyWads) === new BN("0")) {
    return supplyAmount;
  }
  return toHumanDec(
    new BN(toBaseUnitDec(supplyAmount, decimals))
      .mul(new BN(mintSupplyWads))
      .divRound(new BN(totalLiquidityWads))
      .toString(),
    decimals
  );
}

export function getBorrowedAmountWadsWithInterest(
  reserveCumulativeBorrowRateWads: string,
  obligationCumulativeBorrowRateWads: string,
  obligationBorrowAmount: string,
  decimals: number
) {
  const reserveCumulativeBorrowRate = new BN(reserveCumulativeBorrowRateWads);
  const obligationCumulativeBorrowRate = new BN(
    obligationCumulativeBorrowRateWads
  );

  if (
    obligationCumulativeBorrowRate >= reserveCumulativeBorrowRate ||
    obligationBorrowAmount === "0"
  ) {
    return obligationBorrowAmount;
  }

  return toHumanDec(
    new BN(toBaseUnitDec(obligationBorrowAmount, decimals))
      .mul(reserveCumulativeBorrowRate)
      .div(obligationCumulativeBorrowRate)
      .toString(),
    decimals
  );
}

export function concatZeros(value: string, numZeroes: number) {
  return value.concat(Array(numZeroes + 1).join("0"));
}

export function add(addend1: BNumber, addend2: BNumber) {
  const [paddedAddend1, paddedAddend2] = equalPadding(addend1, addend2);

  const sum = new BN(paddedAddend1).add(new BN(paddedAddend2)).toString();
  return new BNumber(sum, Math.max(addend1.precision, addend2.precision));
}

export function subtract(minuend1: BNumber, minuend2: BNumber) {
  const [paddedMinuend1, paddedMinuend2] = equalPadding(minuend1, minuend2);

  return new BNumber(
    new BN(paddedMinuend1).sub(new BN(paddedMinuend2)).toString(),
    Math.max(minuend1.precision, minuend2.precision)
  );
}

export function multiply(multiplicand: BNumber, multiplier: BNumber) {
  return new BNumber(
    new BN(multiplicand.toString())
      .mul(new BN(multiplier.toString()))
      .toString(),
    multiplicand.precision + multiplier.precision
  );
}

// We represent a fraction as a single number, precise always exactly to 18 decimal places and truncated past there
export function divide(dividend: BNumber, divisor: BNumber) {
  if (new BN(divisor.significand).eq(new BN("0"))) {
    return BNaN;
  }

  const [paddedDividend, paddedDivisor] = equalPadding(dividend, divisor);

  // pad the dividend further by 18 digits to get the required precision
  const precisionPaddedDividend = concatZeros(paddedDividend, 18);

  return new BNumber(
    new BN(precisionPaddedDividend).div(new BN(paddedDivisor)).toString(),
    18
  );
}

export function min(...args: Array<BNumber>) {
  const maxPrecision = Math.max(...args.map((arg) => arg.precision));
  const paddedArgs = equalPadding(...args);

  return new BNumber(
    paddedArgs.reduce((a, b) => BN.min(new BN(a), new BN(b)).toString()),
    maxPrecision
  );
}

export function max(...args: Array<BNumber>) {
  const maxPrecision = Math.max(...args.map((arg) => arg.precision));
  const paddedArgs = equalPadding(...args);

  return new BNumber(
    paddedArgs.reduce((a, b) => BN.max(new BN(a), new BN(b)).toString()),
    maxPrecision
  );
}

export function neg(val: BNumber) {
  return new BNumber(new BN(val.significand).neg().toString(), val.precision);
}

function equalPadding(...args: Array<BNumber>) {
  const maxPrecision = Math.max(...args.map((arg) => arg.precision));
  return args.map((arg) =>
    concatZeros(arg.toString(), maxPrecision - arg.precision)
  );
}

export function safeToString(arg: number | string): string {
  if (typeof arg === "string") {
    if (arg.length === 0) {
      return "";
    }

    return arg;
  }

  if (Math.abs(arg) < 1.0) {
    const e = parseInt(arg.toString().split("e-")[1]);
    if (e) {
      arg *= Math.pow(10, e - 1);
      arg = "0." + new Array(e).join("0") + arg.toString().substring(2);
    }
  } else {
    let e = parseInt(arg.toString().split("+")[1]);
    if (e > 20) {
      e -= 20;
      arg /= Math.pow(10, e);
      arg = arg + new Array(e + 1).join("0");
    }
  }
  return arg.toString();
}
