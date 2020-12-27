
const csv = require(`csv`)
const _ = require(`lodash`)
const Promise = require(`bluebird`)
const diff = require(`deep-diff`)
const { getSQLTimestamp, stringifySQLTimestamp, parseSQLTimestamp } = require(`../../lib/utils.js`)
const substruct = require(`@internalfx/substruct`)
const { DateTime } = require(`luxon`)

module.exports = async function (config) {
  const sqlite = substruct.services.sqlite
  const sf = substruct.services.salesforce
  const ifxLock = substruct.services.ifxLock

  const getIterator = async function (sfObject, currentSyncDate) {
    const csvParser = csv.parse({ columns: true })

    const sfQuery = sf.sobject(sfObject.name)
      .select(`*`)
      .where(`SystemModstamp >= ${currentSyncDate.toISO()}`)
      .orderby(`SystemModstamp`, `ASC`)
      .maxFetch(10000)
      .stream()

    sfQuery.pipe(csvParser)

    return csvParser
  }

  const scan = async function () {
    const lock = ifxLock.failLock(`scanRecords`)

    try {
      const sfObjects = sqlite.prepare(`
        SELECT * FROM sfObjectTypes WHERE enabled == 1;
      `).all()

      await Promise.map(sfObjects, async function (sfObject) {
        const currentSyncDate = parseSQLTimestamp(sfObject.syncDate)

        console.log(`Scan ${sfObject.name} from date "${currentSyncDate.toISO()}"`)

        const iterator = await getIterator(sfObject, currentSyncDate)

        let lastRecord = null
        let counter = 0

        for await (const sfRecord of iterator) {
          lastRecord = sfRecord
          counter += 1

          if (!lock.isValid()) {
            console.log(`lock no longer valid!`)
            break
          }

          const record = sqlite.prepare(`
            SELECT * FROM sfObjects WHERE id = $id;
          `).get({ id: sfRecord.Id })

          let result = {}

          if (record == null) {
            result = sfRecord
            sqlite.prepare(`
              INSERT INTO sfObjects
              (id, type, data)
              VALUES
              ($id, $type, $data);
            `).run({
              id: sfRecord.Id,
              type: sfObject.name,
              data: JSON.stringify(sfRecord)
            })
          } else {
            const lastData = JSON.parse(record.data)
            const changes = diff(lastData, sfRecord)

            if (changes) {
              for (const change of changes) {
                _.set(result, change.path, change.rhs)
              }

              sqlite.prepare(`
                UPDATE sfObjects
                SET
                  type = $type,
                  data = $data
                WHERE id = $id;
              `).run({
                id: sfRecord.Id,
                type: sfObject.name,
                data: JSON.stringify(sfRecord)
              })
            }
          }

          if (!_.isEmpty(result)) {
            if (result === sfRecord) {
              console.log(`${sfObject.name} - ${sfRecord.Name}: New record`)
            } else {
              console.log(`${sfObject.name} - ${sfRecord.Name}: ${Object.keys(result).length} changes`)
            }

            const webhooks = sqlite.prepare(`
              SELECT w.* FROM sfObjectTypes AS ot
              JOIN webhookInterests as wi ON wi.sfObjectTypeId == ot.id
              JOIN webhooks as w ON w.id == wi.webhookId
              WHERE ot.name == $name AND w.enabled == 1;
            `).all({
              name: sfObject.name
            })

            for (const webhook of webhooks) {
              sqlite.prepare(`
                INSERT INTO webhookRequests
                (url, method, headers, data, nextRunDate)
                VALUES
                ($url, $method, $headers, $data, $nextRunDate);
              `).run({
                url: webhook.url,
                method: webhook.method,
                headers: null,
                data: JSON.stringify({
                  type: sfObject.name,
                  id: sfRecord.Id,
                  changes: result,
                  record: sfRecord
                }),
                nextRunDate: getSQLTimestamp()
              })
            }
          }

          if (counter > 500) {
            counter = 0

            sqlite.prepare(`
              UPDATE sfObjectTypes
              SET syncDate = $syncDate
              WHERE name == $name;
            `).run({
              name: sfObject.name,
              syncDate: DateTime.fromISO(sfRecord.SystemModstamp).toUTC().toISO()
            })

            lock.renew()
          }
        }

        if (lastRecord) {
          let newSyncDate = DateTime.fromISO(lastRecord.SystemModstamp).toUTC()

          if (newSyncDate.toISO() === currentSyncDate.toISO()) {
            newSyncDate = newSyncDate.plus({ second: 1 })
          }

          sqlite.prepare(`
            UPDATE sfObjectTypes
            SET syncDate = $syncDate
            WHERE name == $name;
          `).run({
            name: sfObject.name,
            syncDate: stringifySQLTimestamp(newSyncDate)
          })
        }
      })
    } catch (err) {
      console.log(err)
    }

    lock.release()
  }

  return {
    scan
  }
}
