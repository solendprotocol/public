import { Button, Flex, Text } from '@chakra-ui/react';
import Loading from 'components/Loading/Loading';
import React from 'react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { formatToken } from 'utils/numberFormatter';
import { ENVIRONMENT } from 'common/config';
import { formatErrorMsg } from 'utils/utils';
import { formatPoolName } from 'utils/formatUtils';

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
  signature: string;
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
      <Flex w='100%' justify='center' align='center' py={48} direction='column'>
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
        py={48}
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
        py={48}
        justify='center'
        align='center'
        w='100%'
        h='100%'
        direction='column'
        gap={8}
      >
        <CheckCircleIcon color='brandAlt' fontSize={96} />
        <Text textAlign='center' variant='title'>
          {formatPoolName(result.action)} successful
          <br />
          {formatToken(result.amountString)} {result.symbol}
        </Text>
        <Text color='secondary'>
          <a
            target='_blank'
            rel='noreferrer'
            href={`https://solscan.io/tx/${result.signature}?cluster=${ENVIRONMENT}`}
          >
            <u>View on Solscan</u>
          </a>
        </Text>
        <Button
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

  return <Flex>{overridePage}</Flex>;
}
