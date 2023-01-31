import type { AppProps } from 'next/app'
import { ChakraProvider, createMultiStyleConfigHelpers, defineStyle, extendTheme } from '@chakra-ui/react'
import classNames from 'classnames';
import { themeConfig, ibmFont, ibmMonoFont } from 'theme/theme';

const theme = extendTheme(themeConfig)

export default function App({ Component, pageProps }: AppProps) {
  return <ChakraProvider theme={theme}>
    <main className={classNames(ibmFont.className, ibmMonoFont.className)}>
      <Component {...pageProps} />
      </main>
    </ChakraProvider>
}
