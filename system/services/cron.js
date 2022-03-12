
// const _ = require('lodash')
const cron = require(`node-cron`)
const substruct = require(`../../substruct.js`)
const { DateTime } = require(`luxon`)

module.exports = async function (config) {
  const scanner = substruct.services.sfScanner
  const processor = substruct.services.requestProcessor
  const sf = substruct.services.salesforce
  const prisma = substruct.services.prisma
  const sqlite = substruct.services.sqlite

  cron.schedule(config.webhookCron, async function () {
    try {
      console.log(`CRON`)

      await scanner.scan()
      await processor.process()
    } catch (err) {
      if (err.name === `FAILLOCK`) {
        console.log(`CRON SKIPPED`)
      } else {
        console.log(err)
      }
    }
  })

  cron.schedule(`0 * * * * *`, async function () {
    console.log(`Clear stale events`)
    await prisma.event.deleteMany({
      where: {
        timestamp: {
          lte: DateTime.utc().minus({ day: 31 }).toISO(),
        },
      },
    })
  })

  cron.schedule(`0 0 * * * *`, async function () {
    console.log(`Clearing Object caches...`)
    sf.clearCache()
  })

  cron.schedule(`0 */5 * * * *`, async function () {
    await sf.ping()
  })

  cron.schedule(`0 0 0 * * *`, async function () {
    console.log(`Analyze database...`)
    sqlite.prepare(`ANALYZE;`).run()
  })
}
