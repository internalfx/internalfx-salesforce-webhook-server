
module.exports = async function (config) {
  const { Nuxt, Builder } = require(`nuxt`)
  const nuxtConfig = require(`../../nuxt.config.js`)

  // Config Overrides
  nuxtConfig.dev = config.isDevelopment
  nuxtConfig.env.baseURL = config.baseURL
  nuxtConfig.axios.baseURL = config.baseURL

  const nuxt = new Nuxt(nuxtConfig)

  await nuxt.ready()

  if (config.build) {
    new Builder(nuxt).build().then(function () {
      config.building = false
    })
  }

  return nuxt
}
