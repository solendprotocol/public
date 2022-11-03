module.exports = {
  mode: "jit",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {},
  },

  plugins: [require("daisyui"), require("@tailwindcss/typography")],
  daisyui: {
    styled: true,
    themes: [
      {
        light: {
          fontFamily: {
            display: ["PT Mono, monospace"],
            body: ["Inter, sans-serif"],
          },
          primary: "#ff5c28" /* Primary color */,
          "primary-focus": "#ff5c28" /* Primary color - focused */,
          "primary-content":
            "#000" /* Foreground content color to use on primary color */,

          secondary: "#707070" /* Secondary color */,
          "secondary-focus": "#707070" /* Secondary color - focused */,
          "secondary-content":
            "#000" /* Foreground content color to use on secondary color */,

          accent: "#33a382" /* Accent color */,
          "accent-focus": "#2aa79b" /* Accent color - focused */,
          "accent-content":
            "#ffffff" /* Foreground content color to use on accent color */,

          neutral: "#f5f5f5" /* Neutral color */,
          "neutral-focus": "#f5f5f5" /* Neutral color - focused */,
          "neutral-content":
            "#707070" /* Foreground content color to use on neutral color */,

          "base-100":
            "#f0f0f0" /* Base color of page, used for blank backgrounds */,
          "base-200": "#f0f0f0" /* Base color, a little darker */,
          "base-300": "#f0f0f0" /* Base color, even more darker */,
          "base-content":
            "#707070" /* Foreground content color to use on base color */,

          info: "#2094f3" /* Info */,
          success: "#009485" /* Success */,
          warning: "#ff9900" /* Warning */,
          error: "#ff5724" /* Error */,

          "--tab-border-color": "#ff5c28",
        },
      },

      {
        dark: {
          fontFamily: {
            display: ["PT Mono, monospace"],
            body: ["Inter, sans-serif"],
          },
          primary: "#ff5c28" /* Primary color */,
          "primary-focus": "#ff5c28" /* Primary color - focused */,
          "primary-content":
            "#ffffff" /* Foreground content color to use on primary color */,

          secondary: "#64676d" /* Secondary color */,
          "secondary-focus": "#64676d" /* Secondary color - focused */,
          "secondary-content":
            "#ffffff" /* Foreground content color to use on secondary color */,

          accent: "#33a382" /* Accent color */,
          "accent-focus": "#2aa79b" /* Accent color - focused */,
          "accent-content":
            "#ffffff" /* Foreground content color to use on accent color */,

          neutral: "#1b1d23" /* Neutral color */,
          neutralAlt: "#1b1d23",
          "neutral-focus": "#64676d" /* Neutral color - focused */,
          "neutral-content":
            "#64676d" /* Foreground content color to use on neutral color */,
          line: " #22252e" /*border lines*/,

          "base-100":
            "#22252e" /* Base color of page, used for blank backgrounds */,
          "base-200": "#22252e" /* Base color, a little darker */,
          "base-300": "#22252e" /* Base color, even more darker */,
          "base-content":
            "#64676d" /* Foreground content color to use on base color */,

          info: "#2094f3" /* Info */,
          success: "#009485" /* Success */,
          warning: "#ff9900" /* Warning */,
          error: "#ff5724" /* Error */,

          "--tab-border-color": "#ff5c28",
        },
      },
    ],
    base: true,
    utils: true,
    logs: true,
    rtl: false,
  },
};
