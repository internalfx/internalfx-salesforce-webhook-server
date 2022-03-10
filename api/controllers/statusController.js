
module.exports = {
  status: async function (ctx) {
    const body = {
      loggedIn: ctx.state.loggedIn,
    }

    // console.log(`STATUS:`, {
    //   loggedIn: ctx.state.loggedIn,
    //   ip: ctx.ip,
    // })

    ctx.body = body
  },
}
