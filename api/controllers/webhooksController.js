
const substruct = require(`../../substruct.js`)

const _ = require(`lodash`)
const { DateTime } = require(`luxon`)
const { randomUUID } = require(`crypto`)

const joi = substruct.services.joi
const prisma = substruct.services.prisma
const sqlite = substruct.services.sqlite

module.exports = {
  list: async function (ctx) {
    if (ctx.state.loggedIn !== true) {
      ctx.throw(403)
    }

    const webhooks = await prisma.webhook.findMany({
      include: {
        webhookInterests: {
          include: {
            sfObject: {},
          },
        },
      },
    })

    ctx.body = {
      webhooks,
    }
  },
  show: async function (ctx) {
    if (ctx.state.loggedIn !== true) {
      ctx.throw(403)
    }

    const args = await joi.object({
      id: joi.string().required(),
    }).validateAsync(ctx.request.body, { noDefaults: true })

    const webhook = await prisma.webhook.findUnique({
      where: { id: args.id },
      include: {
        webhookInterests: {
          select: {
            sfObject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    ctx.body = {
      webhook,
    }
  },
  create: async function (ctx) {
    if (ctx.state.loggedIn !== true) {
      ctx.throw(403)
    }

    const args = await joi.object({
      name: joi.string().required(),
      url: joi.string().required(),
      method: joi.string(),
      enabled: joi.boolean(),
      webhookInterests: joi.array(joi.string()),
    }).validateAsync(ctx.request.body)

    const webhook = await prisma.$transaction(async (prisma) => {
      const webhook = await prisma.webhook.create({
        data: {
          id: randomUUID(),
          ..._.omit(args, `id`, `webhookInterests`),
        },
      })

      if (args.webhookInterests) {
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            webhookInterests: {
              deleteMany: {},
            },
          },
        })

        for (const sfObject of args.webhookInterests) {
          await prisma.webhookInterest.create({
            data: {
              id: randomUUID(),
              webhookId: webhook.id,
              sfObjectId: sfObject.id,
            },
          })
        }
      }

      return webhook
    })

    ctx.body = {
      webhook,
    }
  },
  update: async function (ctx) {
    if (ctx.state.loggedIn !== true) {
      ctx.throw(403)
    }

    const args = await joi.object({
      id: joi.string().required(),
      name: joi.string(),
      url: joi.string(),
      method: joi.string(),
      enabled: joi.boolean(),
      webhookInterests: joi.array(joi.object()),
    }).validateAsync(ctx.request.body, { noDefaults: true })

    const webhook = await prisma.$transaction(async (prisma) => {
      const webhook = await prisma.webhook.update({
        where: { id: args.id },
        data: {
          ..._.omit(args, `id`, `webhookInterests`),
        },
      })

      if (args.webhookInterests) {
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            webhookInterests: {
              deleteMany: {},
            },
          },
        })

        for (const sfObject of args.webhookInterests) {
          await prisma.webhookInterest.create({
            data: {
              id: randomUUID(),
              webhookId: webhook.id,
              sfObjectId: sfObject.id,
            },
          })
        }
      }

      return webhook
    })

    ctx.body = {
      webhook,
    }
  },
  delete: async function (ctx) {
    if (ctx.state.loggedIn !== true) {
      ctx.throw(403)
    }

    const args = await joi.object({
      id: joi.string().required(),
    }).validateAsync(ctx.request.body, { noDefaults: true })

    const webhook = await prisma.webhook.delete({
      where: { id: args.id },
    })

    ctx.body = {
      webhook,
    }
  },
  replay: async function (ctx) {
    if (ctx.state.loggedIn !== true) {
      ctx.throw(403)
    }

    const args = await joi.object({
      id: joi.string().required(),
      syncDate: joi.string().required(),
    }).validateAsync(ctx.request.body)

    const webhook = sqlite.prepare(`
      SELECT * FROM webhooks WHERE id = $id;
    `).get({ id: args.id })

    const sfObjectNames = sqlite.prepare(`
      SELECT o.name FROM webhooks AS w
      JOIN webhookInterests AS wi ON wi.webhookId = w.id
      JOIN sfObjects AS o ON o.id = wi.sfObjectId
      WHERE w.id = $id;
    `).all({ id: webhook.id }).map(i => i.name)

    const queryNext = sqlite.prepare(`
      SELECT * FROM events
      WHERE type IN (${sfObjectNames.map(i => `'${i}'`).join(`,`)}) AND (timestamp > $timestamp OR (timestamp == $timestamp AND id > $lastId))
      ORDER BY timestamp ASC, id ASC
      LIMIT 1000;
    `)

    let timestamp = DateTime.fromISO(args.syncDate).toUTC().toISO()
    let lastId = ``

    let events = queryNext.all({ timestamp, lastId })

    const queryInsertWebhookRequest = sqlite.prepare(`
      INSERT INTO webhookRequests
      (headers, data, nextRunDate, webhookId)
      VALUES
      ($headers, $data, $nextRunDate, $webhookId);
    `)

    while (events.length > 0) {
      const lastEvent = _.last(events)

      sqlite.transaction(function () {
        for (const event of events) {
          queryInsertWebhookRequest.run({
            headers: null,
            data: JSON.stringify({
              type: event.type,
              id: event.id,
              action: event.action,
              changes: JSON.parse(event.changes),
            }),
            nextRunDate: DateTime.utc().toISO(),
            webhookId: webhook.id,
          })
        }
      })()

      timestamp = lastEvent.timestamp
      lastId = lastEvent.id

      events = await queryNext.all({ timestamp, lastId })
    }

    ctx.body = {
      success: true,
    }
  },
}
