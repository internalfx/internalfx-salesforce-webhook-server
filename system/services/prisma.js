
module.exports = async function (config) {
  const { PrismaClient } = require(`@prisma/client`)
  const prisma = new PrismaClient({ errorFormat: `minimal` })

  return prisma
}
