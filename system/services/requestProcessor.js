
const substruct = require(`@internalfx/substruct`)
const rp = require(`request-promise`)
const { DateTime } = require(`luxon`)
const Promise = require(`bluebird`)
const _ = require(`lodash`)
const { to, getSQLTimestamp, stringifySQLTimestamp } = require(`../../lib/utils.js`)

module.exports = async function (config) {
  const sqlite = substruct.services.sqlite
  const ifxLock = substruct.services.ifxLock

  const process = async function () {
    const lock = ifxLock.failLock(`requestProcessor`, 180 * 1000)

    try {
      const webhookIds = sqlite.prepare(`
        SELECT webhookId FROM webhookRequests GROUP BY webhookId;
      `).all().map(i => i.webhookId)

      await Promise.map(webhookIds, async function (webhookId) {
        const webhook = sqlite.prepare(`
          SELECT * FROM webhooks WHERE id = $id;
        `).get({ id: webhookId })

        const queryNext = sqlite.asyncPrepare(`
          SELECT * FROM webhookRequests
          WHERE
            webhookId == $webhookId AND
            nextRunDate < $nextRunDate AND
            (nextRunDate > $lastRunDate OR (nextRunDate == $lastRunDate AND id > $lastId))
          ORDER BY nextRunDate ASC, id ASC
          LIMIT 200;
        `)

        const nextRunDate = getSQLTimestamp()
        let lastRunDate = DateTime.fromSeconds(0).toUTC().toISO()
        let lastId = ``

        let requests = await queryNext.all({ webhookId, lastRunDate, nextRunDate, lastId })

        while (requests.length > 0) {
          const payload = requests.map(function (request) {
            return JSON.parse(request.data)
          })

          if (!lock.isValid()) {
            console.log(`lock no longer valid!`)
            return
          }

          const result = await to(rp({
            url: webhook.url,
            method: webhook.method,
            json: true,
            body: payload
          }))

          if (!lock.isValid()) {
            console.log(`lock no longer valid!`)
            return
          }

          sqlite.transaction(function () {
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
          })()

          const lastRequest = _.last(requests)
          lastRunDate = lastRequest.nextRunDate
          lastId = lastRequest.id

          requests = await queryNext.all({ webhookId, lastRunDate, nextRunDate, lastId })
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
