import Image from 'next/image';
import { Text, Flex } from '@chakra-ui/react';

export default function Logo() {
  return (
    <Flex align='center'>
      <Image src='/logo.dark.svg' alt='solend logo' width={104} height={50} />
      <Text ml='6px' mt='1px' fontSize={20}>
        LITE
      </Text>
    </Flex>
  );
}
