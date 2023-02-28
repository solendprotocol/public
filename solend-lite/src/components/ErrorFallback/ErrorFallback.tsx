import { Text, Flex, Button } from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';

export function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <Flex
      align='center'
      justify='center'
      py={48}
      w='100%'
      h='100%'
      direction='column'
      gap={8}
    >
      <WarningIcon color='brand' fontSize={96} />
      <Text variant='title'>Something went wrong</Text>
      <Text variant='secondary'>{error.message}</Text>
      <Button onClick={resetErrorBoundary}>
        <Text color='neutral'>Try again</Text>
      </Button>
    </Flex>
  );
}
