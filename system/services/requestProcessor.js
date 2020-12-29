
const substruct = require(`@internalfx/substruct`)
const rp = require(`request-promise`)
const { DateTime } = require(`luxon`)
const Promise = require(`bluebird`)
const { to, getSQLTimestamp, stringifySQLTimestamp } = require(`../../lib/utils.js`)

module.exports = async function (config) {
  const sqlite = substruct.services.sqlite
  const ifxLock = substruct.services.ifxLock

  const process = async function () {
    const lock = ifxLock.failLock(`requestProcessor`, 30000)

    try {
      const webhookIds = sqlite.prepare(`
        SELECT webhookId FROM webhookRequests GROUP BY webhookId;
      `).all().map(i => i.webhookId)

      await Promise.map(webhookIds, async function (webhookId) {
        const requests = sqlite.prepare(`
          SELECT * FROM webhookRequests WHERE nextRunDate <= $nextRunDate AND webhookId == $webhookId;
        `).all({
          nextRunDate: getSQLTimestamp(),
          webhookId
        })

        const payload = requests.map(function (request) {
          return JSON.parse(request.data)
        })

        const webhook = sqlite.prepare(`
          SELECT * FROM webhooks WHERE id = $id;
        `).get({ id: webhookId })

        const result = await to(rp({
          url: webhook.url,
          method: webhook.method,
          json: true,
          body: payload
        }))

        if (!lock.isValid()) {
          console.log(`lock no longer valid!`)
          return
        } else {
          lock.renew()
        }

        for (const request of requests) {
          if (result.isError) {
            if (request.attempts <= 16) {
              const nextRunDate = DateTime.fromMillis(Date.now() + (Math.pow(2, request.attempts) * 1000))
              sqlite.prepare(`
                UPDATE webhookRequests SET attempts = attempts + 1, nextRunDate = $nextRunDate WHERE id = $id;
              `).run({
                id: request.id,
                nextRunDate: stringifySQLTimestamp(nextRunDate)
              })
              console.log(result.message)
            } else {
              sqlite.prepare(`
                DELETE FROM webhookRequests WHERE id = $id;
              `).run({
                id: request.id
              })
              console.log(`webhook request ${request.id} had too many failures.`)
            }
          } else {
            sqlite.prepare(`
              DELETE FROM webhookRequests WHERE id = $id;
            `).run({
              id: request.id
            })
            console.log(`webhook request ${request.id} sent.`)
          }
        }
      }, { concurrency: 3 })
    } catch (err) {
      console.log()
    }

    lock.release()
  }

  return {
    process
  }
}
