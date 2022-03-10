
const path = require(`path`)

module.exports = {
  axios: {},
  build: {
    extend: function (config, ctx) {
      config.resolve.alias[`~lib`] = path.resolve(__dirname, `lib`)
      config.resolve.alias[`~ui`] = path.resolve(__dirname, `client/ui`)
    },
    postcss: {},
  },
  buildModules: [
    `@nuxtjs/vuetify`,
  ],
  env: {},
  head: {
    title: `InternalFX SWS`,
    meta: [
      { charset: `utf-8` },
      { name: `viewport`, content: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui` },
      { hid: `description`, name: `description`, content: `InternalFX Salesforce Webhook Server` },
    ],
    link: [
      { rel: `icon`, type: `image/x-icon`, href: `/icon.png` },
    ],
  },
  loading: { color: `#1D4F90` },
  modules: [
    `@nuxtjs/axios`,
  ],
  plugins: [
    { src: `plugins/startup-client.js`, mode: `client` },
  ],
  rootDir: path.join(__dirname),
  router: {
    middleware: [`auth`],
    extendRoutes: function (routes, resolve) {
      routes.push({
        path: `/`,
        redirect: `/webhooks`,
      })
    },
  },
  srcDir: path.join(__dirname, `client`),
  ssr: false,
  telemetry: false,
  vuetify: {
    defaultAssets: false,
    optionsPath: path.join(__dirname, `client`, `vuetify.options.js`),
  },
}
