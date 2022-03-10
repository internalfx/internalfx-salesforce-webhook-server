
module.exports = function (config) {
  return async function (ctx, next) {
    try {
      await next()
      if (ctx.status === 404) {
        ctx.throw(404)
      }
    } catch (err) {
      console.error(err)
      let status = 500
      if (isFinite(err.status)) {
        status = err.status
      }
      ctx.status = status
      let message = err.message
      if (status >= 500 && config.production) {
        message = `There was an error processing your request.`
      }
      ctx.body = message
    }
  }
}
