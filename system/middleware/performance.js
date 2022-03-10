
module.exports = function () {
  return async function (ctx, next) {
    console.time(`${ctx.method} ${ctx.request.url}`)
    await next()
    console.timeEnd(`${ctx.method} ${ctx.request.url}`)
  }
}
