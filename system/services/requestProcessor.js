
const substruct = require(`@internalfx/substruct`)
const rp = require(`request-promise`)
const { DateTime } = require(`luxon`)
const { to, getSQLTimestamp, stringifySQLTimestamp } = require(`../../lib/utils.js`)

module.exports = async function (config) {
  const sqlite = substruct.services.sqlite
  const ifxLock = substruct.services.ifxLock

  const process = async function () {
    const lock = ifxLock.failLock(`requestProcessor`, 30000)

    try {
      const requests = sqlite.prepare(`
        SELECT * FROM webhookRequests WHERE nextRunDate <= $nextRunDate;
      `).all({
        nextRunDate: getSQLTimestamp()
      })

      for (const request of requests) {
        if (!lock.isValid()) {
          console.log(`lock no longer valid!`)
          break
        }

        const result = await to(rp({
          url: request.url,
          method: request.method,
          json: true,
          body: JSON.parse(request.data)
        }))

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

        lock.renew()
      }
    } catch (err) {
      console.log()
    }

    lock.release()
  }

  return {
    process
  }
}
