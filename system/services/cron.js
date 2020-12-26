
// const _ = require('lodash')
const cron = require(`node-cron`)
const substruct = require(`@internalfx/substruct`)

module.exports = async function (config) {
  const scanner = substruct.services.sfScanner
  const processor = substruct.services.requestProcessor
  const jobs = {}

  jobs.scannerJob = cron.schedule(config.webhookCron, async function () {
    try {
      console.log(`CRON`)

      await scanner.scan()
      await processor.process()
    } catch (err) {
      console.log(err)
    }
  })

  jobs.scannerJob.start()

  const stopAll = function () {
    for (const [key] of Object.entries(jobs)) {
      jobs[key].stop()
    }
  }

  return {
    stopAll
  }
}
