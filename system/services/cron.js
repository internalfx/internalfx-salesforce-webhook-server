
// const _ = require('lodash')
const cron = require(`node-cron`)
const substruct = require(`@internalfx/substruct`)

module.exports = async function (config) {
  const scanner = substruct.services.sfScanner
  const processor = substruct.services.requestProcessor
  const sf = substruct.services.salesforce

  cron.schedule(config.webhookCron, async function () {
    try {
      console.log(`CRON`)

      await scanner.scan()
      await processor.process()
    } catch (err) {
      console.log(err)
    }
  })

  cron.schedule(`0 0 * * * *`, async function () {
    console.log(`Clearing Object caches...`)
    sf.cache.clear()
  })

  cron.schedule(`0 */5 * * * *`, async function () {
    await sf.ping()
  })
}
