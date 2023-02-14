import React, { ReactElement } from 'react';
import { Center, Flex, Text, useMediaQuery } from '@chakra-ui/react';

function Footer(): ReactElement {
  const [isLargerThan800] = useMediaQuery('(min-width: 800px)');

  return (
    <Flex
      align='center'
      justify='space-between'
      borderTop='1px'
      px='32px'
      h='100%'
    >
      <Text variant='caption' color='secondary'>
        Solend
      </Text>
      <Center gap={4}>
        <a target='_blank' href='https://solend.fi' rel='noreferrer'>
          <Text variant='caption' color='secondary'>
            Main site
          </Text>
        </a>
        {isLargerThan800 ? (
          <a target='_blank' href='https://dev.solend.fi' rel='noreferrer'>
            <Text variant='caption' color='secondary'>
              Develop
            </Text>
          </a>
        ) : null}
        {isLargerThan800 ? (
          <a
            target='_blank'
            href='https://jobs.solana.com/jobs?q=SOLEND'
            rel='noreferrer'
          >
            <Text variant='caption' color='secondary'>
              Careers
            </Text>
          </a>
        ) : null}
        {isLargerThan800 ? (
          <a
            target='_blank'
            href='https://twitter.com/solendprotocol'
            rel='noreferrer'
          >
            <Text variant='caption' color='secondary'>
              Twitter
            </Text>
          </a>
        ) : null}
        {isLargerThan800 ? (
          <a
            target='_blank'
            href='https://discord.gg/aGXvPNGXDT'
            rel='noreferrer'
          >
            <Text variant='caption' color='secondary'>
              Discord
            </Text>
          </a>
        ) : null}
        {isLargerThan800 ? (
          <a target='_blank' href='https://blog.solend.fi' rel='noreferrer'>
            <Text variant='caption' color='secondary'>
              Blog
            </Text>
          </a>
        ) : null}
      </Center>
    </Flex>
  );
}

export default Footer;
