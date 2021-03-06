
const _ = require(`lodash`)
const { gql } = require(`apollo-server-koa`)
const { DateTime } = require(`luxon`)
const { getSQLTimestamp } = require(`../../lib/utils.js`)

const typeDefs = gql`
  type Webhook {
    id: Int!
    name: String
    url: String
    method: String
    enabled: Boolean
    webhookInterests: [String]
  }

  input WebhookInput {
    id: Int
    name: String
    url: String
    method: String
    enabled: Boolean
    webhookInterests: [String]
  }

  extend type Query {
    allWebhooks (
      page: Int = 1,
      pageSize: Int = 10
    ): [Webhook]
    getWebhook (id: Int!): Webhook
  }

  extend type Mutation {
    upsertWebhook (payload: WebhookInput!): Webhook
    destroyWebhook (id: Int!): Boolean
    replayWebhook (id: Int! syncDate: DateTime!): Boolean
  }
`

const resolvers = {
  Query: {
    allWebhooks: async function (obj, args, ctx, info) {
      ctx.requireLogin()
      return ctx.prisma.webhook.findMany()
    },
    getWebhook: async function (obj, args, ctx, info) {
      ctx.requireLogin()
      return ctx.prisma.webhook.findFirst({
        where: { id: args.id }
      })
    }
  },
  Mutation: {
    upsertWebhook: async function (obj, args, ctx, info) {
      ctx.requireLogin()

      const payload = args.payload
      payload.enabled = payload.enabled ? 1 : 0
      let webhookId

      ctx.sqlite.transaction(function () {
        if (!payload.id) {
          webhookId = ctx.sqlite.prepare(`
            INSERT INTO webhooks (name, url, method, enabled)
              VALUES ($name, $url, $method, $enabled);
          `).run({ ...payload }).lastInsertRowid
        } else {
          const changes = ctx.sqlite.prepare(`
            UPDATE webhooks
            SET
              ${_.compact([
                payload.name != null ? `name = $name` : null,
                payload.url != null ? `url = $url` : null,
                payload.method != null ? `method = $method` : null,
                payload.enabled != null ? `enabled = $enabled` : null
              ]).join(`,`)}
            WHERE id = $id;
          `).run({ ...payload }).changes

          if (changes !== 1) {
            ctx.userInputError(`Regimen ID ${payload.id} not found`)
          }

          webhookId = payload.id
        }

        // Handle webhookInterests
        if (payload.webhookInterests) {
          const webhookInterests = payload.webhookInterests.map(i => `'${i}'`)

          ctx.sqlite.prepare(`
            DELETE FROM webhookInterests WHERE webhookId = $webhookId;
          `).run({ webhookId })

          const sfObjectTypes = ctx.sqlite.prepare(`
            SELECT * FROM sfObjectTypes WHERE name IN (${webhookInterests.join(`,`)});
          `).all()

          for (const sfObjectType of sfObjectTypes) {
            ctx.sqlite.prepare(`
              INSERT INTO webhookInterests
                (webhookId, sfObjectTypeId)
              VALUES
                ($webhookId, $sfObjectTypeId)
            `).run({ webhookId, sfObjectTypeId: sfObjectType.id })
          }
        }
      })()
    },
    destroyWebhook: async function (obj, args, ctx, info) {
      ctx.requireLogin()

      ctx.sqlite.prepare(`
        DELETE FROM webhooks WHERE id = $id;
      `).run({ id: args.id })

      return true
    },
    replayWebhook: async function (obj, args, ctx, info) {
      const webhook = ctx.sqlite.prepare(`
        SELECT * FROM webhooks WHERE id = $id;
      `).get({ id: args.id })

      const sfObjectNames = ctx.sqlite.prepare(`
        SELECT sot.name FROM webhooks AS w
        JOIN webhookInterests AS wi ON wi.webhookId == w.id
        JOIN sfObjectTypes AS sot ON sot.id == wi.sfObjectTypeId
        WHERE w.id == $id;
      `).all({ id: webhook.id }).map(i => i.name)

      const queryNext = ctx.sqlite.asyncPrepare(`
        SELECT * FROM sfObjects
        WHERE type IN (${sfObjectNames.map(i => `'${i}'`).join(`,`)}) AND (timestamp > $timestamp OR (timestamp == $timestamp AND id > $lastId))
        ORDER BY timestamp ASC, id ASC
        LIMIT 1000;
      `)

      let timestamp = DateTime.fromJSDate(args.syncDate).toUTC().toISO()
      let lastId = ``

      let records = await queryNext.all({ timestamp, lastId })

      while (records.length > 0) {
        const lastRecord = _.last(records)

        console.log(records.map(i => `${i.id}:${i.timestamp}`))

        const queryInsertWebhookRequest = ctx.sqlite.prepare(`
          INSERT INTO webhookRequests
          (headers, data, nextRunDate, webhookId)
          VALUES
          ($headers, $data, $nextRunDate, $webhookId);
        `)

        ctx.sqlite.transaction(function () {
          for (const record of records) {
            queryInsertWebhookRequest.run({
              headers: null,
              data: JSON.stringify({
                type: record.type,
                id: record.id,
                action: `update`,
                changes: _.isEmpty(record.changes) ? null : JSON.parse(record.changes),
                record: JSON.parse(record.data)
              }),
              nextRunDate: getSQLTimestamp(),
              webhookId: webhook.id
            })
          }
        })()

        timestamp = lastRecord.timestamp
        lastId = lastRecord.id

        records = await queryNext.all({ timestamp, lastId })
      }
    }
  },
  Webhook: {
    webhookInterests: async function (obj, args, ctx, info) {
      return ctx.sqlite.prepare(`
        SELECT sot.name FROM webhooks AS w
        JOIN webhookInterests AS wi ON w.id == wi.webhookId
        JOIN sfObjectTypes AS sot ON sot.id == wi.sfObjectTypeId
        WHERE w.id == $id;
      `).all({ id: obj.id }).map(i => i.name)
    }
  }
}

module.exports = {
  typeDefs,
  resolvers
}
