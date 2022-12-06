import { useState, useRef, useEffect, forwardRef } from "react";
import Link from "next/link";
import { ReactSVG } from "react-svg";

import { BNumber } from "utils/utils";
import { formatExact, formatUSD } from "utils/numberFormatter";
interface AssetInputPropsType {
  selectedToken: any;
  onChange: (amount: string) => void;
  value: string | null;
  maxPossibleValue: string;
  useCToken?: boolean;
  showSymbol?: boolean;
}

const AssetInput = forwardRef<HTMLSpanElement, AssetInputPropsType>(
  (
    { selectedToken, onChange, value, maxPossibleValue, useCToken, showSymbol },
    forwardedRef
  ) => {
    const inputRef = useRef<any>();
    const [useUSD, setUseUSD] = useState(false);
    const [inputFocused, setInputFocused] = useState(false);
    const [usdAmount, setUSDAmount] = useState<string | null>(null);

    function handleUSDAmount(amount: string | null) {
      setUSDAmount(amount ? formatUSD(amount) : "");
      console.log(typeof usdAmount);
    }

    useEffect(() => {
      inputRef.current.focus();
    }, [inputRef]);

    let exchangeRate = selectedToken.assetPriceUSD;

    const formatToken = (amount: string) => {
      const vals = amount.split(".");
      const formattedString = `${vals[0].replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ","
      )}${vals.length >= 2 ? "." : ""}${
        useUSD ? (vals[1] ?? "").substring(0, 2) : vals[1] ?? ""
      }`;
      let parsedAmount = `${vals[0]}${vals.length >= 2 ? "." : ""}${
        useUSD ? (vals[1] ?? "").substring(0, 2) : vals[1] ?? ""
      }`;

      // If the user has only typed in a single "." characters, we
      // assume the value is 0.
      if (parsedAmount === ".") {
        parsedAmount = "0";
      }

      return {
        formattedString,
        parsedAmount,
      };
    };

    useEffect(() => {
      if (useUSD) {
        inputRef.current.textContent = usdAmount || "";
      } else {
        inputRef.current.textContent = value
          ? formatToken(value).formattedString
          : "";
      }
    }, [useUSD, exchangeRate]);

    const focusMainInput = () => {
      const input = inputRef.current;
      if (input) {
        input.focus();
        const range = document.createRange();
        const sel = window.getSelection();

        if (input.childNodes[0]) {
          range.setStart(input.childNodes[0], input.innerHTML.length);
          range.collapse(true);

          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }
    };

    const handleMax = () => {
      onChange(maxPossibleValue);
      const mpvObj = new BNumber(maxPossibleValue);
      const usdValue = mpvObj.multiply(new BNumber(exchangeRate)).toString();
      handleUSDAmount(usdValue);
      if (useUSD) {
        inputRef.current.textContent = maxPossibleValue
          ? formatUSD(usdValue)
          : "";
      } else {
        inputRef.current.textContent = maxPossibleValue
          ? formatToken(maxPossibleValue).formattedString
          : "";
      }
    };

    const handleValueChange = (
      amount: string,
      unformattedString?: string | null
    ) => {
      const { formattedString, parsedAmount } = formatToken(amount);

      const inputString = unformattedString ?? formattedString;

      // The formatting to create a thousand separator causes the cursor to jump
      // Because we want this input to grow as you type, we use a span with editableContent that doesn't have
      // some helpful functions on cursor anchoring. Thus we have to compute cursor position like below
      const el = inputRef.current;
      const range = document.createRange();
      const sel = window.getSelection();

      const offset = sel?.anchorOffset ?? el.childNodes[0]?.length ?? 0;

      const delta = inputString.length - inputRef.current.textContent.length;

      inputRef.current.textContent = inputString;

      if (el.childNodes[0]) {
        range.setStart(
          el.childNodes[0],
          delta < 0 ? el.childNodes[0].length : offset + delta
        );
        range.collapse(true);

        sel?.removeAllRanges();
        sel?.addRange(range);
      }

      const exchangeObj = new BNumber(exchangeRate);

      if (useUSD) {
        handleUSDAmount(parsedAmount);
        onChange(new BNumber(parsedAmount).divideBy(exchangeObj).toString());
      } else {
        handleUSDAmount(
          new BNumber(parsedAmount).multiply(exchangeObj).toString()
        );
        onChange(parsedAmount);
      }
    };

    const fontSize = useUSD
      ? 48 - 1.4 * ((usdAmount ?? "").toString().length + 1)
      : 48 -
        1.4 *
          ((value ?? "").toString().length +
            selectedToken?.tokenSymbol?.length);

    const nullAmount = !usdAmount || isNaN(usdAmount);

    if (value === "" && inputRef?.current.textContent !== "") {
      // Edge case for resetting the input if the textContent and value don't match
      handleValueChange("", "");
    }

    return (
      <div className="flex flex-row w-full py-6 justify-between">
        <span
          className="btn btn-circle text-sm text-primary-content"
          onClick={() => handleMax()}
        >
          MAX
        </span>
        <div className="flex flex-col items-center gap-2 whitespace-nowrap">
          <span
            className={`leading-8 w-full text-primary-content duration-200 outline-0 whitespace-nowrap ${
              !inputFocused && nullAmount && "text-secondary-content"
            }`}
            style={{
              fontSize,
            }}
            aria-hidden="true"
          >
            {useUSD && (
              <span
                onClick={focusMainInput}
                aria-hidden="true"
                className="outline-0"
              >
                ${!inputFocused && nullAmount && 0}
              </span>
            )}

            <span
              role="textbox"
              inputMode="decimal"
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              ref={(node) => {
                inputRef.current = node;
                if (typeof forwardedRef === "function") {
                  forwardedRef(node);
                } else if (forwardedRef) {
                  // eslint-disable-next-line no-param-reassign
                  forwardedRef.current = node;
                }
              }}
              className="whitespace-nowrap outline-0"
              onInput={(e) => {
                const parsedContent =
                  e?.currentTarget?.textContent?.replace(/[^\d.]/g, "") || "";
                if ((e?.nativeEvent as any)?.inputType?.startsWith("delete")) {
                  handleValueChange(
                    parsedContent,
                    e?.currentTarget?.textContent
                  );
                } else {
                  handleValueChange(parsedContent);
                }
              }}
              contentEditable
              aria-hidden="true"
            />
            {!useUSD && (
              <span
                onClick={focusMainInput}
                aria-hidden="true"
                className="outline-0"
              >
                {!inputFocused && nullAmount && 0}
                &nbsp;
                {showSymbol ? selectedToken.tokenSymbol : ""}
              </span>
            )}
          </span>
          <small className="text-neutral-content text-sm">
            {" "}
            ≈{" "}
            {useUSD
              ? `${value ? formatExact(value) : ""} ${
                  showSymbol ? selectedToken.tokenSymbol : ""
                } `
              : `$${nullAmount || !usdAmount ? "0" : usdAmount}`}
          </small>
        </div>

        <span
          className="btn btn-circle text-sm text-primary-content"
          onClick={() => setUseUSD(!useUSD)}
        >
          {" "}
          <ReactSVG wrapper="span" src="/icons/arrowdownup.svg" />
        </span>
      </div>
    );
  }
);

AssetInput.defaultProps = {
  showSymbol: true,
};
AssetInput.displayName = "AssetInput";
export default AssetInput;
