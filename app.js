require(`@babel/register`)({
  cwd: __dirname,
  plugins: [`@babel/plugin-transform-modules-commonjs`],
  only: [
    `./lib/*`
  ]
})

require(`./lib/cycle.js`)
const substruct = require(`@internalfx/substruct`)
const { ApolloServer, ForbiddenError } = require(`apollo-server-koa`)
const { typeDefs, resolvers } = require(`./graphql/index.js`)
const argv = require(`minimist`)(process.argv.slice(2))
const path = require(`path`)

const configPath = path.join(process.cwd(), `config.js`)
const userConfig = require(configPath)

substruct.configure({
  ...userConfig,
  env: argv.dev ? `development` : `production`,
  building: argv.build === true,
  runDir: process.cwd(),
  appDir: __dirname
})

const main = async function () {
  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: function (error) {
      const data = JSON.decycle(error)
      console.log(`================================================================== GRAPHQL ERROR`)
      console.dir(data, { colors: true, depth: null })
      console.log(`================================================================================`)
      return data
    },
    context: async function ({ ctx }) {
      const token = ctx.state.token
      const loggedIn = ctx.state.loggedIn
      const prisma = substruct.services.prisma
      const sqlite = substruct.services.sqlite
      const config = substruct.config

      const requireLogin = function () {
        if (loggedIn !== true) {
          throw new ForbiddenError(`You must be an Administrator to do that.`)
        }
      }

      return {
        prisma,
        sqlite,
        config,
        loggedIn,
        token,
        requireLogin,
        services: substruct.services,
        ip: ctx.ip
      }
    }
  })

  await substruct.load()
  await substruct.start()

  apollo.applyMiddleware({ app: substruct.koa, path: `/api/graphql` })
  console.log(`Server Started...`)
}

main().catch(function (err) {
  console.log(err)
})
