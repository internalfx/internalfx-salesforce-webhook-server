
const _ = require(`lodash`)
const substruct = require(`../../substruct.js`)
// const config = substruct.config

module.exports = async function (config) {
  const arrayQueryTest = /^\w+\[]$/

  return async function (ctx, next) {
    const httpMethod = ctx.method.toLowerCase()

    const route = substruct.routeMap.find(function (route) {
      return route.method === httpMethod && route.re.test(ctx.path)
    })

    if (route) {
      ctx.state = { route: _.cloneDeep(route.state), ...ctx.state }
      const pathData = route.re.exec(ctx.path)
      pathData.shift()
      ctx.state.params = { ...ctx.query }
      Object.keys(ctx.query).forEach(function (key) {
        if (arrayQueryTest.test(key)) {
          let val = ctx.query[key]
          delete ctx.state.params[key]
          if (!_.isArray(val)) {
            val = [val]
          }
          ctx.state.params[key.slice(0, -2)] = val
        }
      })

      route.keys.forEach(function (key, idx) {
        ctx.state.params[key.name] = pathData[idx]
      })

      if (!substruct.controllers[route.controller]) {
        ctx.throw(500, `controller or method "${route.controller}" missing.`)
      }

      await substruct.controllers[route.controller](ctx)
    }

    await next()
  }
}
