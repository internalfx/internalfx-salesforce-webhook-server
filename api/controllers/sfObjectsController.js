
const _ = require(`lodash`)
const { randomUUID } = require(`crypto`)

const substruct = require(`../../substruct.js`)

const joi = substruct.services.joi
const prisma = substruct.services.prisma

module.exports = {
  list: async function (ctx) {
    if (ctx.state.loggedIn !== true) {
      ctx.throw(403)
    }

    const sfObjects = await prisma.sfObject.findMany()

    ctx.body = {
      sfObjects,
    }
  },
  show: async function (ctx) {
    if (ctx.state.loggedIn !== true) {
      ctx.throw(403)
    }

    const args = await joi.object({
      id: joi.string().required(),
    }).validateAsync(ctx.request.body, { noDefaults: true })

    const sfObject = await prisma.sfObject.findUnique({
      where: { id: args.id },
    })

    ctx.body = {
      sfObject,
    }
  },
  create: async function (ctx) {
    if (ctx.state.loggedIn !== true) {
      ctx.throw(403)
    }

    const args = await joi.object({
      name: joi.string().required(),
      enabled: joi.boolean(),
      syncDate: joi.string().required(),
    }).validateAsync(ctx.request.body)

    const sfObject = await prisma.sfObject.create({
      data: {
        id: randomUUID(),
        ...args,
        slug: args.name ? _.snakeCase(args.name) : undefined,
      },
    })

    ctx.body = {
      sfObject,
    }
  },
  update: async function (ctx) {
    if (ctx.state.loggedIn !== true) {
      ctx.throw(403)
    }

    const args = await joi.object({
      id: joi.string().required(),
      name: joi.string(),
      enabled: joi.boolean(),
      syncDate: joi.string(),
      syncId: joi.string(),
      deleteDate: joi.string(),
    }).validateAsync(ctx.request.body, { noDefaults: true })

    const sfObject = await prisma.sfObject.update({
      where: { id: args.id },
      data: {
        ..._.omit(args, `id`),
        slug: args.name ? _.snakeCase(args.name) : undefined,
      },
    })

    ctx.body = {
      sfObject,
    }
  },
  delete: async function (ctx) {
    if (ctx.state.loggedIn !== true) {
      ctx.throw(403)
    }

    const args = await joi.object({
      id: joi.string().required(),
    }).validateAsync(ctx.request.body, { noDefaults: true })

    const sfObject = await prisma.sfObject.delete({
      where: { id: args.id },
    })

    ctx.body = {
      sfObject,
    }
  },
}
