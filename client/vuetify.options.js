
import '@mdi/font/css/materialdesignicons.css'

export default function ({ app, env }) {
  const config = {
    theme: {
      themes: {
        light: {
          primary: `#1D4F90`,
          secondary: `#606571`,
          accent: `#D51717`,
        },
      },
      // options: {
      //   customProperties: true,
      // },
    },
    icons: {
      iconfont: `mdiSvg`, // default - only for display purposes
    },
  }

  return config
}
