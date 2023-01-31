import { inputAnatomy } from '@chakra-ui/anatomy'
import { IBM_Plex_Sans, IBM_Plex_Mono } from '@next/font/google'
import { ChakraProvider, createMultiStyleConfigHelpers, defineStyle, extendTheme } from '@chakra-ui/react'

const { definePartsStyle, defineMultiStyleConfig } =
createMultiStyleConfigHelpers(inputAnatomy.keys)

export const ibmFont = IBM_Plex_Sans({ subsets: ['latin'], weight: [
    '500', 
    '300', 
    '400'
  ]
});

export const ibmMonoFont = IBM_Plex_Mono({ weight: [
  '400'
]});

const baseStyle = definePartsStyle({
// define the part you're going to style
field: {
  color: 'primary', // change the input text color
  fontSize: 'sm',
  borderColor: 'line'
},
})

const inputTheme = defineMultiStyleConfig({ baseStyle, defaultProps: {
    size: 'sm',
    focusBorderColor: 'primary'
} })

export const themeConfig = {
    radii: 0,
    colors: {
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
          gutter: 0
        }
      },
      Input: {...inputTheme},
      Button: {
        baseStyle: {
          fontSize: 14,
          fontWeight: 500,
          lineHeight: '24px',
          fontFamily: ibmFont.style.fontFamily,
        }
      },
      Text: {
        baseStyle: {
          color: "primary",
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
          }
        },
        defaultProps: {
          variant: "body",
        },
      },
    }
  }