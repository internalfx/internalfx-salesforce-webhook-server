
const koaBody = require(`koa-body`)

module.exports = function (config) {
  return koaBody(config.koaBody)
}
