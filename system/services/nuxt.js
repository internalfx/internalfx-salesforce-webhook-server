
module.exports = async function (config) {
  const { Nuxt, Builder } = require(`nuxt`)
  const nuxtConfig = require(`../../nuxt.config.js`)

  // Config Overrides
  nuxtConfig.dev = (config.env !== `production`)
  nuxtConfig.axios.baseURL = config.baseURL
  nuxtConfig.apollo.clientConfigs.default.httpEndpoint = `/api/graphql`
  nuxtConfig.env.isDevelopment = (config.env === `development`)

  const nuxt = new Nuxt(nuxtConfig)

  await nuxt.ready()

  new Builder(nuxt).build().then(function () {
    config.building = false
  })

  return nuxt
}
