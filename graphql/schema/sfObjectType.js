
const _ = require(`lodash`)
const { gql } = require(`apollo-server-koa`)
const { DateTime } = require(`luxon`)

const typeDefs = gql`
  type sfObjectType {
    id: Int!
    name: String
    enabled: Boolean
    syncDate: DateTime
  }

  input sfObjectTypeInput {
    id: Int
    name: String
    enabled: Boolean
    syncDate: DateTime
  }

  extend type Query {
    allSfObjectTypes: [sfObjectType]
    getSfObjectType (id: Int!): sfObjectType
  }

  extend type Mutation {
    upsertSfObjectType (payload: sfObjectTypeInput!): sfObjectType
    destroySfObjectType (id: Int!): Boolean
  }
`

const resolvers = {
  Query: {
    allSfObjectTypes: async function (obj, args, ctx, info) {
      ctx.requireLogin()
      return ctx.prisma.sfObjectType.findMany({
        orderBy: [
          { name: `asc` }
        ]
      })
    },
    getSfObjectType: async function (obj, args, ctx, info) {
      ctx.requireLogin()
      return ctx.prisma.sfObjectType.findFirst({
        where: { id: args.id }
      })
    }
  },
  Mutation: {
    upsertSfObjectType: async function (obj, args, ctx, info) {
      ctx.requireLogin()

      const payload = args.payload
      payload.enabled = payload.enabled ? 1 : 0
      payload.syncDate = DateTime.fromJSDate(payload.syncDate).toUTC().toISO()
      let sfObjectId

      ctx.sqlite.transaction(function () {
        if (!payload.id) {
          sfObjectId = ctx.sqlite.prepare(`
          INSERT INTO sfObjectTypes
            (name, enabled, syncDate)
          VALUES
            ($name, $enabled, $syncDate);
          `).run({ ...payload }).lastInsertRowid
        } else {
          const changes = ctx.sqlite.prepare(`
            UPDATE sfObjectTypes
            SET
              ${_.compact([
                payload.enabled != null ? `enabled = $enabled` : null,
                payload.syncDate != null ? `syncDate = $syncDate` : null
              ]).join(`,`)}
            WHERE id = $id;
          `).run({ ...payload }).changes

          if (changes !== 1) {
            ctx.userInputError(`Regimen ID ${payload.id} not found`)
          }

          sfObjectId = payload.id
        }
      })()

      return ctx.sqlite.prepare(`
        SELECT * FROM sfObjectTypes WHERE id == $id;
      `).get({ id: sfObjectId })
    },
    destroySfObjectType: async function (obj, args, ctx, info) {
      ctx.requireLogin()

      ctx.sqlite.prepare(`
        DELETE FROM sfObjectTypes WHERE id == $id;
      `).run(args)

      return true
    }
  },
  sfObjectType: {
  }
}

module.exports = {
  typeDefs,
  resolvers
}
