import { inputAnatomy } from '@chakra-ui/anatomy';
import { IBM_Plex_Sans, IBM_Plex_Mono } from '@next/font/google';
import { createMultiStyleConfigHelpers, defineStyle } from '@chakra-ui/react';
import { modalTheme } from './modal';
import { tabsTheme } from './tab';

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(inputAnatomy.keys);

export const ibmFont = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['500', '300', '400'],
  display: 'block',
});

export const ibmMonoFont = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400'],
  display: 'block',
});

const baseStyle = definePartsStyle({
  // define the part you're going to style
  field: {
    color: 'primary', // change the input text color
    fontSize: 'sm',
    borderColor: 'line',
  },
});

const inputTheme = defineMultiStyleConfig({
  baseStyle,
  defaultProps: {
    size: 'sm',
    focusBorderColor: 'primary',
  } as any,
});

const baseTableStyle = definePartsStyle({
  table: {
    fontVariantNumeric: 'lining-nums tabular-nums',
    borderCollapse: 'collapse',
    width: 'full',
  },
  tbody: {
    tr: {
      _hover: {
        bg: '#1b1d23',
      },
    },
  },
  th: {
    fontFamily: 'heading',
    fontWeight: 'bold',
    textTransform: 'unset',
    letterSpacing: 'wider',
    textAlign: 'start',
    border: 'unset !important',
  },
  td: {
    textAlign: 'start',
    border: 'unset !important',
  },
  caption: {
    mt: 4,
    fontFamily: 'heading',
    textAlign: 'center',
    fontWeight: 'medium',
  },
} as any);

const tableTheme = defineMultiStyleConfig({
  baseStyle: baseTableStyle,
});

const variantGhost = defineStyle({
  borderRadius: 'md',
  transitionProperty: 'common',
  transitionDuration: 'normal',
  _focusVisible: {
    boxShadow: 'outline',
  },
  _disabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  _hover: {
    backgroundColor: 'var(--chakra-colors-line) !important',
  },
  fontSize: 14,
  fontWeight: 500,
  lineHeight: '24px',
  fontFamily: ibmFont.style.fontFamily,
});

export const themeConfig = {
  semanticTokens: {
    colors: {
      'chakra-border-color': { _light: 'var(--chakra-colors-line)' },
      'tabs-border-color': { _light: 'var(--chakra-colors-line)' },
      'chakra-placeholder-color': { _light: 'var(--chakra-colors-secondary)' },
    },
  },
  radii: 0,
  colors: {
    white: '#0e1118',
    primary: '#fff',
    secondary: '#64676d',
    line: '#22252e',
    neutralAlt: '#1b1d23',
    neutral: '#0e1118',
    overlay: '#0e1118',
    brandAlt: '#0da098',
    brand: '#ff5c28',
  },
  components: {
    Menu: {
      baseStyle: {
        gutter: 0,
      },
    },
    Modal: modalTheme,
    Table: tableTheme,
    Tabs: tabsTheme,
    Input: inputTheme,
    Button: { variants: { ghost: variantGhost } },
    Text: {
      baseStyle: {
        color: 'primary',
        fontFamily: ibmFont.style.fontFamily,
      },
      variants: {
        display: {
          fontWeight: 300,
          fontSize: 48,
          lineHeight: '62.4px',
        },
        title: {
          fontSize: 20,
          fontWeight: 500,
          lineHeight: '28px',
        },
        headline: {
          fontSize: 16,
          fontWeight: 500,
          lineHeight: '24px',
        },
        body: {
          fontSize: 14,
          fontWeight: 400,
          lineHeight: '24px',
        },
        bodyMono: {
          fontFamily: ibmMonoFont.style.fontFamily,
          fontSize: 14,
          fontWeight: 400,
          lineHeight: '24px',
        },
        label: {
          fontSize: 12,
          fontWeight: 500,
          lineHeight: '16px',
        },
        caption: {
          fontSize: 12,
          fontWeight: 400,
          lineHeight: '16px',
        },
        captionMono: {
          fontFamily: ibmMonoFont.style.fontFamily,
          fontSize: 12,
          fontWeight: 400,
          lineHeight: '16px',
        },
        disclosure: {
          fontSize: 10,
          fontWeight: 400,
          lineHeight: '12px',
        },
      },
      defaultProps: {
        variant: 'body',
      },
    },
  },
  initialColorMode: 'dark',
  useSystemColorMode: false,
};
