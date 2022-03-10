
const substruct = require(`../../substruct.js`)
const config = substruct.config

module.exports = {
  config: async function (ctx) {
    const code = `
      window.ifxApp = {
        env: '${config.env}',
        buildNumber: ${config.buildNumber},
        baseURL: '${config.baseURL}',
      }
    `

    ctx.set(`Content-Type`, `text/javascript`)
    ctx.set(`Content-Length`, code.length)

    ctx.body = code
  },
}
