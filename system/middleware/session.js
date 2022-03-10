
const substruct = require(`../../substruct.js`)
const _ = require(`lodash`)
const { parseSQLTimestamp } = require(`../../lib/utils.js`)
const { DateTime } = require(`luxon`)

module.exports = function (config) {
  const sqlite = substruct.services.sqlite
  const cookieName = config.session.sessionCookieName

  const loadSession = async function (token) {
    if (token) {
      const session = await sqlite.prepare(`
        SELECT * FROM sessions WHERE token == $token;
      `).get({ token })

      if (session == null || parseSQLTimestamp(session.createdAt) < DateTime.utc().minus({ days: 1 })) {
        return false
      }

      return true
    }

    return null
  }

  return async function (ctx, next) {
    let token

    const cookieToken = decodeURI(ctx.cookies.get(cookieName))
    const headerToken = ctx.headers.authorization

    if (_.isString(cookieToken) && !_.isEmpty(cookieToken)) {
      token = cookieToken.replace(`Bearer `, ``)
    }

    if (_.isString(headerToken) && !_.isEmpty(headerToken)) {
      token = headerToken.replace(`Bearer `, ``)
    }

    ctx.state.loggedIn = await loadSession(token)
    ctx.state.token = ctx.state.loggedIn ? token : null

    await next()
  }
}
