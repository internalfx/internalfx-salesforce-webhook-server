
const substruct = require(`../../substruct.js`)
const _ = require(`lodash`)

const config = substruct.config

const joi = substruct.services.joi
const prisma = substruct.services.prisma

module.exports = {
  list: async function (ctx) {
    // console.log(`PARAMS ============================`)
    // console.log(ctx.state.params)
    // console.log(`BODY ==============================`)
    // console.log(ctx.request.body)

    const args = await joi.object({
      type: joi.string(),
      fromDate: joi.string(),
      cursor: joi.string(),
      apikey: joi.string().required(),
    }).validateAsync(ctx.request.body)

    if (args.apikey !== config.apikey) {
      ctx.throw(403)
    }

    if (args.type) {
      const sfObject = await prisma.sfObject.findUnique({
        where: { name: args.type },
      })

      if (sfObject == null) {
        ctx.throw(400, `Invalid object type, did you add it first?`)
      }
    }

    const where = {}

    if (args.type) {
      where.type = args.type
    }

    if (args.fromDate) {
      where.timestamp = { gte: args.fromDate }
    }

    if (args.cursor) {
      where.key = { gt: args.cursor }
    }

    const events = (await prisma.event.findMany({
      where: where,
      orderBy: [
        { timestamp: `asc` },
        { key: `asc` },
      ],
      take: 1000,
    })).map(function (record) {
      record.changes = JSON.parse(record.changes)
      return record
    })

    ctx.body = {
      events,
      cursor: _.last(events) ? _.last(events).key : null,
    }
  },
}
