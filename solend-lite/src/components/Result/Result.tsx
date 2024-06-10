import { Box, Button, Flex, Text } from '@chakra-ui/react';
import Loading from 'components/Loading/Loading';
import React from 'react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { formatToken } from 'utils/numberFormatter';
import { ENVIRONMENT } from 'common/config';
import { formatErrorMsg } from 'utils/utils';
import { titleCase } from '@solendprotocol/solend-sdk';

type LoadingResultType = {
  type: 'loading';
  message?: React.ReactNode;
};

type ErrorResultType = {
  type: 'error';
  message: string;
  onBack?: () => void;
};

type SuccessResultType = {
  type: 'success';
  amountString: string;
  signatures: Array<string>;
  symbol: string;
  action: string;
  onBack?: () => void;
};

export type ResultConfigType =
  | ErrorResultType
  | SuccessResultType
  | LoadingResultType;

type ResultPropsType = {
  result: ResultConfigType;
  setResult: (result: ResultConfigType | null) => void;
};

export default function Result({ result, setResult }: ResultPropsType) {
  let overridePage = <div />;

  if (result?.type === 'loading') {
    overridePage = (
      <Flex w='100%' justify='center' align='center' py={24} direction='column'>
        <Loading />
        <Text mt={4} color='secondary'>
          Waiting for confirmation...
        </Text>
      </Flex>
    );
  }

  if (result?.type === 'error') {
    overridePage = (
      <Flex
        py={24}
        justify='center'
        align='center'
        w='100%'
        h='100%'
        direction='column'
        gap={8}
      >
        <WarningIcon color='brand' fontSize={96} />
        <Text textAlign='center' variant='title'>
          Error
        </Text>
        <Text color='secondary'>
          {result.message && formatErrorMsg(result.message)}
        </Text>
        <Button
          size='md'
          w='100%'
          onClick={() => {
            if (result.onBack) result.onBack();
            setResult(null);
          }}
        >
          Back
        </Button>
      </Flex>
    );
  }

  if (result?.type === 'success') {
    overridePage = (
      <Flex
        py={24}
        justify='center'
        align='center'
        w='100%'
        h='100%'
        direction='column'
        gap={8}
      >
        <CheckCircleIcon color='brandAlt' fontSize={96} />
        <Text textAlign='center' variant='title'>
          {titleCase(result.action)} successful
          <br />
          <div>
            {formatToken(result.amountString)} {result.symbol}
          </div>
        </Text>
        {result.signatures.map((signature, index) => (
          <>
            {index > 0 && <br />}
            <Text color='secondary'>
              <a
                target='_blank'
                rel='noreferrer'
                href={`https://solscan.io/tx/${signature}?cluster=${ENVIRONMENT}`}
              >
                <u>View on Solscan</u>
              </a>
            </Text>
          </>
        ))}
        <Button
          size='md'
          w='100%'
          onClick={() => {
            if (result.onBack) result.onBack();
            setResult(null);
          }}
        >
          Back
        </Button>
      </Flex>
    );
  }

  return (
    <Box px={6} py={2}>
      {overridePage}
    </Box>
  );
}
