import React, {
  forwardRef,
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { ReactSVG } from 'react-svg';
import classNames from 'classnames';
import { formatExact, formatUsd } from 'utils/numberFormatter';
import BigNumber from 'bignumber.js';
import { Box, Flex, Text } from '@chakra-ui/react';

import styles from './BigInput.module.scss';
import { SelectedReserveType } from 'stores/pools';

interface BigInputPropsType {
  selectedToken: SelectedReserveType;
  onChange: (amount: string) => void;
  value: string | null;
  maxPossibleValue: BigNumber;
  useCToken?: boolean;
  showSymbol?: boolean;
}

const BigInput = forwardRef<HTMLSpanElement, BigInputPropsType>(
  function BigInput(
    { selectedToken, onChange, value, maxPossibleValue, useCToken, showSymbol },
    forwardedRef,
  ) {
    const inputRef = useRef<any>();
    const [useUsd, setUseUsd] = useState(false);
    const [inputFocused, setInputFocused] = useState(false);
    const [usdAmount, setUsdAmount] = useState<string | null>(null);

    function handleUsdAmount(amount: string | null) {
      setUsdAmount(amount ? formatUsd(amount, true) : '');
    }

    useEffect(() => {
      inputRef.current.focus();
    }, [inputRef]);

    const exchangeRate = selectedToken.price;

    const formatToken = useCallback(
      (amount: string) => {
        const vals = amount.split('.');
        const formattedString = `${vals[0].replace(
          /\B(?=(\d{3})+(?!\d))/g,
          ',',
        )}${vals.length >= 2 ? '.' : ''}${
          useUsd ? (vals[1] ?? '').substring(0, 2) : vals[1]?.substring(0, selectedToken.decimals) ?? ''
        }`;
        let parsedAmount = `${vals[0]}${vals.length >= 2 ? '.' : ''}${
          useUsd ? (vals[1] ?? '').substring(0, 2) : vals[1]?.substring(0, selectedToken.decimals) ?? ''
        }`;

        // If the user has only typed in a single "." characters, we
        // assume the value is 0.
        if (parsedAmount === '.') {
          parsedAmount = '0';
        }

        return {
          formattedString,
          parsedAmount,
        };
      },
      [useUsd],
    );

    useEffect(() => {
      if (inputRef.current) {
        if (useUsd) {
          inputRef.current.textContent = usdAmount || '';
        } else {
          inputRef.current.textContent = value
            ? formatToken(value).formattedString
            : '';
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useUsd, exchangeRate]);

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
      const mpvString = maxPossibleValue.toString();
      onChange(mpvString);
      const usdValue = maxPossibleValue
        .times(new BigNumber(exchangeRate))
        .toString();
      handleUsdAmount(usdValue);
      if (useUsd) {
        inputRef.current.textContent = mpvString
          ? formatUsd(usdValue, true)
          : '';
      } else {
        inputRef.current.textContent = mpvString
          ? formatToken(mpvString).formattedString
          : '';
      }
    };

    const handleValueChange = (
      amount: string,
      unformattedString?: string | null,
    ) => {
      const { formattedString, parsedAmount } = formatToken(amount);

      const inputString = unformattedString ?? formattedString;

      // The formatting to create a thousand separator causes the cursor to jump
      // Because we want this input to grow as you type, we use a span with editableContent that doesn't have
      // some helpful functions on cursor anchoring. Thus we have to compute cursor position like below
      const el = inputRef.current;
      if (inputRef.current) {
        const range = document.createRange();
        const sel = window.getSelection();

        const offset = sel?.anchorOffset ?? el.childNodes[0]?.length ?? 0;

        const delta = inputString.length - inputRef.current.textContent.length;

        inputRef.current.textContent = inputString;

        if (el.childNodes[0]) {
          range.setStart(
            el.childNodes[0],
            delta < 0 ? el.childNodes[0].length : offset + delta,
          );
          range.collapse(true);

          sel?.removeAllRanges();
          sel?.addRange(range);
        }

        const exchangeObj = new BigNumber(exchangeRate);

        if (useUsd) {
          handleUsdAmount(parsedAmount);
          onChange(
            new BigNumber(parsedAmount).dividedBy(exchangeObj).decimalPlaces(selectedToken.decimals).toString(),
          );
        } else {
          handleUsdAmount(
            new BigNumber(parsedAmount).multipliedBy(exchangeObj).toString(),
          );
          onChange(parsedAmount);
        }
      }
    };

    const fontSize = useUsd
      ? 48 - 1.4 * ((usdAmount ?? '').toString().length + 1)
      : 48 -
        1.2 *
          ((value ?? '').toString().length +
            (selectedToken.symbol?.length ?? 0));

    const nullAmount = !usdAmount || Number.isNaN(Number(usdAmount));

    if (value === '' && inputRef?.current?.textContent !== '') {
      // Edge case for resetting the input if the textContent and value don't match
      handleValueChange('', '');
    }

    return (
      <div className={styles.container}>
        <Flex
          justify='space-between'
          align='middle'
          className={styles.inputRow}
        >
          <Box flexBasis='12.5%'>
            <div
              className={styles.iconContainer}
              onClick={() => {
                handleMax();
                focusMainInput();
              }}
              aria-hidden='true'
            >
              <ReactSVG src='/max.svg' className={styles.maxButton} />
            </div>
          </Box>
          <Box
            flexBasis='75%'
            className={classNames(
              styles.amountInput,
              !inputFocused && nullAmount && styles.nullAmount,
            )}
            style={{
              fontSize,
            }}
          >
            {useUsd && (
              <span onClick={focusMainInput} aria-hidden='true'>
                ${!inputFocused && nullAmount && 0}
              </span>
            )}
            <span
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              ref={(node) => {
                inputRef.current = node;
                if (typeof forwardedRef === 'function') {
                  forwardedRef(node);
                } else if (forwardedRef) {
                  // eslint-disable-next-line no-param-reassign
                  forwardedRef.current = node;
                }
              }}
              className={styles.input}
              role='textbox'
              inputMode='decimal'
              contentEditable
              onInput={(e) => {
                const parsedContent =
                  e?.currentTarget?.textContent?.replace(/[^\d.]/g, '') || '';
                if ((e?.nativeEvent as any).inputType.startsWith('delete')) {
                  handleValueChange(
                    parsedContent,
                    e?.currentTarget?.textContent,
                  );
                } else {
                  handleValueChange(parsedContent);
                }
              }}
              aria-hidden='true'
            />
            {!useUsd && (
              <span onClick={focusMainInput} aria-hidden='true'>
                {!inputFocused && nullAmount && 0}
                &nbsp;
                {useCToken ? 'c' : ''}
                {showSymbol ? selectedToken.symbol : ''}
              </span>
            )}
          </Box>
          <Box flexBasis='12.5%' order='right'>
            <Flex justify='end'>
              <div
                className={styles.iconContainer}
                onClick={() => {
                  setUseUsd(!useUsd);
                  focusMainInput();
                }}
                aria-hidden='true'
              >
                <ReactSVG src='/switch.svg' className={styles.swapButton} />
              </div>
            </Flex>
          </Box>
        </Flex>
        <Text variant='label' color='secondary'>
          ≈{' '}
          {useUsd
            ? `${value ? formatExact(value) : ''} ${useCToken ? 'c' : ''}${
                showSymbol ? selectedToken.symbol : ''
              }`
            : `$${nullAmount || !usdAmount ? '0' : usdAmount}`}
        </Text>
      </div>
    );
  },
);

BigInput.defaultProps = {
  useCToken: false,
  showSymbol: true,
};

export default BigInput;
