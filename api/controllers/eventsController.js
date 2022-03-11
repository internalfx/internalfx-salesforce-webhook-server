
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
      _.set(where, `AND.type`, { in: args.type })
    }

    if (args.fromDate && args.cursor) {
      where.OR = [
        {
          AND: {
            timestamp: args.fromDate,
            key: { gt: args.cursor },
          },
        },
        {
          timestamp: { gt: args.fromDate },
        },
      ]
    } else if (args.fromDate) {
      _.set(where, `AND.timestamp`, { gte: args.fromDate })
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

    const last = _.last(events)

    ctx.body = {
      events,
      cursor: last ? last.key : null,
      fromDate: last ? last.timestamp : null,
    }
  },
}
