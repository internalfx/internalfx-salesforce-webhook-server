
const path = require(`path`)

module.exports = {
  apollo: {
    clientConfigs: {
      default: {
        httpLinkOptions: {
          credentials: `same-origin`
        },
        inMemoryCacheOptions: {
          addTypename: false
        }
      }
    }
  },
  axios: {},
  build: {
    babel: {
      presets: function ({ isServer }) {
        return [
          [
            require.resolve(`@nuxt/babel-preset-app`),
            {
              buildTarget: isServer ? `server` : `client`,
              corejs: { version: 3 }
            }
          ]
        ]
      }
    },
    extend: function (config, { isDev, isClient }) {
      if (isDev && isClient) {
        config.devtool = `inline-source-map`
      }

      // config.performance.maxEntrypointSize = 3000000
      // config.performance.maxAssetSize = 3000000

      // config.optimization.runtimeChunk = false
      // config.optimization.splitChunks = false
    }
  },
  buildModules: [
    `@nuxtjs/vuetify`
  ],
  env: {},
  head: {
    title: `InternalFX SWS`,
    meta: [
      { charset: `utf-8` },
      { name: `viewport`, content: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui` },
      { hid: `description`, name: `description`, content: `InternalFX Salesforce Webhook Server` }
    ],
    link: [
      { rel: `icon`, type: `image/x-icon`, href: `/icon.png` }
    ]
  },
  ssr: false,
  loading: { color: `#1D4F90` },
  modules: [
    `@nuxtjs/apollo`,
    `@nuxtjs/axios`
  ],
  plugins: [
    `plugins/graphClient.js`,
    { src: `plugins/startup.js`, mode: `client` },
    { src: `plugins/vuetify.js`, mode: `client` }
  ],
  rootDir: path.join(__dirname),
  router: {
    middleware: [
      `auth`
    ],
    extendRoutes: function (routes, resolve) {
      routes.push({
        path: `/`,
        redirect: `/webhooks`
      })
    }
  },
  srcDir: path.join(__dirname, `client`),
  telemetry: false,
  vuetify: {
    defaultAssets: false,
    optionsPath: path.join(__dirname, `client`, `vuetify.options.js`)
  }
}
