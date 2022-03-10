
const substruct = require(`../../substruct.js`)

module.exports = function (config) {
  const nuxt = substruct.services.nuxt
  const ignoredRoutes = [
    /^\/api\//,
  ]

  return async function (ctx, next) {
    const ignored = ignoredRoutes.reduce(function (acc, regex) {
      if (acc === true) {
        return true
      } else if (regex.test(ctx.path) === true) {
        return true
      } else {
        return false
      }
    }, false)

    if (ignored === false) {
      ctx.status = 200

      await new Promise((resolve, reject) => {
        ctx.res.on(`close`, resolve)
        ctx.res.on(`finish`, resolve)
        ctx.res.on(`error`, reject)
        nuxt.render(ctx.req, ctx.res)
      })
    }

    await next()
  }
}
