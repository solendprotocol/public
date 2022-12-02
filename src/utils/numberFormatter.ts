import React from "react";
import numbro from "numbro";

import BigNumber from "bignumber.js";

export function formatExact(value: string | number) {
  return new BigNumber(value).toFormat();
}

export function formatToken(
  value: string | number,
  digits = 4,
  exactTip?: boolean,
  noTrim?: boolean,
  // by default we truncate for tokens
  round?: boolean,
  exact?: boolean
): React.ReactNode {
  const bn = new BigNumber(value);
  if (exact) {
    return formatExact(value);
  }
  if (
    bn.isLessThan(1 / 10 ** digits) &&
    !bn.isLessThanOrEqualTo(new BigNumber(0))
  ) {
    return `< ${1 / 10 ** digits}`;
  }

  const usedValue = round ? value : bn.toFormat(digits, 1);

  const contents = numbro(usedValue).format({
    thousandSeparated: true,
    trimMantissa: !noTrim,
    optionalMantissa: !noTrim,
    mantissa: digits,
  });

  return contents;
}

export function formatRoundedToken(
  value: string | number,
  rounded?: boolean
): string {
  const bn = new BigNumber(value);
  if (bn.isLessThan(0.0001) && !bn.isLessThanOrEqualTo(new BigNumber(0))) {
    return "< 0.0001";
  }

  return bn.toFormat(
    !bn.isLessThan(1000) || rounded ? 0 : 2,
    4 // ROUND_HALF_UP
  );
}

export function formatUSD(
  value: string | number,
  omitPrefix?: boolean,
  rounded?: boolean,
  sigFigs?: number,
  noTrim?: boolean
): string {
  const bn = new BigNumber(value);
  const neg = bn.isLessThan(0);
  const abs = bn.abs();
  if (value === "0" && sigFigs)
    return `${neg ? "-" : ""}${omitPrefix ? "" : "$"}${Number(abs).toPrecision(
      sigFigs + 1
    )}`;
  if (sigFigs && bn.lt(0.1)) {
    return `${neg ? "-" : ""}${omitPrefix ? "" : "$"}${Number(abs).toPrecision(
      sigFigs
    )}`;
  }
  if (
    !noTrim &&
    bn.isLessThan(0.01) &&
    !bn.isLessThanOrEqualTo(new BigNumber(0))
  ) {
    return `< ${omitPrefix ? "" : "$"}0.01`;
  }
  // When we have to do token price conversion into USD, we are often either too precise
  // or not precise enough to fully net a number back to 0. This accounts for that inaccuracy
  if (bn.abs().isLessThan(0.0001)) {
    return `${omitPrefix ? "" : "$"}0${rounded ? "" : ".00"}`;
  }

  return `${neg ? "-" : ""}${numbro(abs).format({
    thousandSeparated: true,
    trimMantissa: false,
    mantissa: rounded ? 0 : 2,
  })}`;
}

// e.g. 2.3M or 4.3K
// export function formatRoundedUSD(value: string | number): string {
//   if (new BigNumber(value).isLessThan(1000)) {
//     return formatUSD(value);
//   }
//   const mainLength = numeral(value).format('0a').length - 1;
//   return `$${numeral(value)
//     .format(`0.${Array(3 - mainLength + 1).join('0')}a`)
//     .toUpperCase()}`;
// }

export function formatPercent(
  value: string | number,
  noTrim?: boolean,
  limit?: number
) {
  const bnPercent = new BigNumber(value).multipliedBy(100);
  if (
    bnPercent.isLessThan(limit ?? 0.0001) &&
    !bnPercent.isLessThanOrEqualTo(new BigNumber(0))
  ) {
    return "< 0.01%";
  }

  return numbro(value).format({
    output: "percent",
    thousandSeparated: true,
    trimMantissa: !noTrim,
    optionalMantissa: !noTrim,
    mantissa: 2,
  });
}
