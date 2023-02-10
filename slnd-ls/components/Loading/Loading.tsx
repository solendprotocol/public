import React, { ReactElement } from 'react';
import { SpinnerIcon } from '@chakra-ui/icons';
import { Flex } from '@chakra-ui/react';

import styles from './Loading.module.scss';

function Loading(): ReactElement {
  return (
    <Flex w='100%' h='100%' justify='center' align='center'>
      <SpinnerIcon className={styles.loading} color='brand' />
    </Flex>
  );
}

export default Loading;
