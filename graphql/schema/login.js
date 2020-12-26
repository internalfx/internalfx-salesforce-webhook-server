
const { gql } = require(`apollo-server-koa`)
const { uniqueId, stringifySQLTimestamp } = require(`../../lib/utils.js`)
const { UserInputError } = require(`apollo-server-koa`)
const { DateTime } = require(`luxon`)

const typeDefs = gql`
  extend type Query {
    loggedIn: Boolean
  }

  extend type Mutation {
    login (
      password: String!
    ): JSON
    logout: Boolean
  }
`

const resolvers = {
  Query: {
    loggedIn: async function (obj, args, ctx, info) {
      return ctx.loggedIn
    }
  },
  Mutation: {
    login: async function (obj, args, ctx, info) {
      if (ctx.config.password === args.password) {
        const token = uniqueId(40)

        ctx.sqlite.prepare(`
          INSERT INTO sessions (token, createdAt) VALUES ($token, $createdAt);
        `).run({ token, createdAt: stringifySQLTimestamp(DateTime.utc()) })

        return {
          token
        }
      } else {
        throw new UserInputError(`Invalid password.`)
      }
    },
    logout: async function (obj, args, ctx, info) {
      if (ctx.token == null) {
        throw new UserInputError(`You are not logged in.`)
      }

      ctx.sqlite.prepare(`
        DELETE FROM sessions WHERE token = $token;
      `).run({ token: ctx.token })

      return true
    }
  }
}

module.exports = {
  typeDefs,
  resolvers
}
