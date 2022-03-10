
const { uniqueId } = require(`../../lib/utils.js`)
const substruct = require(`../../substruct.js`)
const { DateTime } = require(`luxon`)

const config = substruct.config

const sqlite = substruct.services.sqlite
const joi = substruct.services.joi

module.exports = {
  login: async function (ctx) {
    // console.log(`PARAMS ============================`)
    // console.log(ctx.state.params)
    // console.log(`BODY ==============================`)
    // console.log(ctx.request.body)

    const args = await joi.object({
      password: joi.string().required(),
    }).validateAsync(ctx.request.body)

    if (config.password === args.password) {
      const token = uniqueId(40)

      sqlite.prepare(`
        INSERT INTO sessions (token, createdAt) VALUES ($token, $createdAt);
      `).run({ token, createdAt: DateTime.utc().toISO() })

      ctx.cookies.set(config.session.sessionCookieName, token, {
        maxAge: config.session.sessionCookieMaxAge,
        httpOnly: false,
        sameSite: `none`,
        secure: true,
      })

      ctx.body = { token }
    } else {
      ctx.throw(400, `Invalid password.`)
    }
  },
  logout: async function (ctx) {
    if (ctx.state.loggedIn !== true) {
      ctx.throw(403)
    }

    sqlite.prepare(`
      DELETE FROM sessions WHERE token = $token;
    `).run({ token: ctx.state.token })

    ctx.body = null
  },
}
