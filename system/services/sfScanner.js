
const csv = require(`csv`)
const _ = require(`lodash`)
const Promise = require(`bluebird`)
const diff = require(`deep-diff`)
const { getSQLTimestamp, parseSQLTimestamp, getEventKey } = require(`../../lib/utils.js`)
const substruct = require(`../../substruct.js`)
const { DateTime } = require(`luxon`)

module.exports = async function (config) {
  const sqlite = substruct.services.sqlite
  const sf = substruct.services.salesforce
  const ifxLock = substruct.services.ifxLock

  const getIterator = async function (sfObject, currentSyncDate, currentSyncId) {
    const csvParser = csv.parse({ columns: true })

    let where

    if (currentSyncId) {
      where = `
        (SystemModstamp = ${currentSyncDate.toISO()} AND Id > '${currentSyncId}')
        OR
        SystemModstamp > ${currentSyncDate.toISO()}
      `
    } else {
      where = `
        SystemModstamp >= ${currentSyncDate.toISO()}
      `
    }

    const sfQuery = sf.sobject(sfObject.name)
      .select(`*`)
      .where(where)
      .sort({ SystemModstamp: 1, Id: 1 })
      .maxFetch(10000)
      .on(`error`, function (err) {
        console.log(`SalesForce Query Error =======================`, sfObject.name)
        console.log(err)
      })
      .stream()

    sfQuery.pipe(csvParser)

    return csvParser
  }

  const scan = async function () {
    const lock = ifxLock.failLock(`scanRecords`)

    try {
      const sfObjects = sqlite.prepare(`
        SELECT * FROM sfObjects WHERE enabled == 1;
      `).all()

      await Promise.map(sfObjects, async function (sfObjectItem) {
        const sfObject = sqlite.prepare(`
          SELECT * FROM sfObjects WHERE id = $id;
        `).get({ id: sfObjectItem.id })

        let currentSyncDate = DateTime.fromISO(sfObject.syncDate)
        currentSyncDate = currentSyncDate.isValid ? currentSyncDate : DateTime.utc()

        console.log(`Scan ${sfObject.name} from date "${currentSyncDate.toISO()}"`)

        const iterator = await getIterator(sfObject, currentSyncDate, sfObject.syncId)

        let lastRecord = null
        let counter = 0

        const webhooks = sqlite.prepare(`
          SELECT w.* FROM sfObjects AS o
          JOIN webhookInterests as wi ON wi.sfObjectId == o.id
          JOIN webhooks as w ON w.id == wi.webhookId
          WHERE o.name == $name AND w.enabled == 1;
        `).all({
          name: sfObject.name,
        })

        for await (const sfRecord of iterator) {
          lastRecord = sfRecord
          counter += 1

          if (!lock.isValid()) {
            console.log(`lock no longer valid!`)
            break
          }

          const record = sqlite.prepare(`
            SELECT * FROM sfRecords WHERE id = $id;
          `).get({ id: sfRecord.Id })

          let result = {}
          let action = null

          if (record == null) {
            action = DateTime.fromISO(sfRecord.CreatedDate).toUTC() >= DateTime.fromISO(sfRecord.SystemModstamp).toUTC().minus({ minute: 1 }) ? `create` : `update`
            result = sfRecord
            sqlite.prepare(`
              INSERT INTO sfRecords
              (id, type, timestamp, data)
              VALUES
              ($id, $type, $timestamp, $data);
            `).run({
              id: sfRecord.Id,
              type: sfObject.name,
              timestamp: DateTime.fromISO(sfRecord.SystemModstamp).toUTC().toISO(),
              data: JSON.stringify(sfRecord),
            })
          } else {
            action = `update`
            const lastData = JSON.parse(record.data)
            const changes = diff(lastData, sfRecord)

            if (changes) {
              for (const change of changes) {
                _.set(result, change.path, change.rhs)
              }

              sqlite.prepare(`
                UPDATE sfRecords
                SET
                  type = $type,
                  timestamp = $timestamp,
                  data = $data
                WHERE id = $id;
              `).run({
                id: sfRecord.Id,
                type: sfObject.name,
                timestamp: DateTime.fromISO(sfRecord.SystemModstamp).toUTC().toISO(),
                data: JSON.stringify(sfRecord),
              })
            }
          }

          if (!_.isEmpty(result)) {
            if (result === sfRecord) {
              console.log(`${sfObject.name} - ${sfRecord.Name}: New record`)
            } else {
              console.log(`${sfObject.name} - ${sfRecord.Name}: ${Object.keys(result).length} changes`)
            }

            // console.log(`=============================`)
            // console.log(`${sfRecord.SystemModstamp}`)
            // console.log(`${DateTime.fromISO(sfRecord.SystemModstamp).toUTC().toISO()} > ${DateTime.utc().minus({ day: 30 }).toISO()}`)

            if (DateTime.fromISO(sfRecord.SystemModstamp).toUTC() > DateTime.utc().minus({ day: 30 })) {
              sqlite.prepare(`
                INSERT INTO events
                (key, id, type, action, timestamp, changes)
                VALUES
                ($key, $id, $type, $action, $timestamp, $changes);
              `).run({
                key: getEventKey(),
                id: sfRecord.Id,
                type: sfObject.name,
                action,
                timestamp: DateTime.fromISO(sfRecord.SystemModstamp).toUTC().toISO(),
                changes: JSON.stringify(result),
              })
            }

            for (const webhook of webhooks) {
              sqlite.prepare(`
                INSERT INTO webhookRequests
                (headers, data, nextRunDate, webhookId)
                VALUES
                ($headers, $data, $nextRunDate, $webhookId);
              `).run({
                headers: null,
                data: JSON.stringify({
                  type: sfObject.name,
                  id: sfRecord.Id,
                  action,
                  changes: result,
                }),
                nextRunDate: getSQLTimestamp(),
                webhookId: webhook.id,
              })
            }
          }

          if (counter > 500) {
            counter = 0

            sqlite.prepare(`
              UPDATE sfObjects
              SET
                syncDate = $syncDate,
                syncId = $syncId
              WHERE name == $name;
            `).run({
              name: sfObject.name,
              syncDate: DateTime.fromISO(sfRecord.SystemModstamp).toUTC().toISO(),
              syncId: sfRecord.Id,
            })

            lock.renew()
          }
        }

        if (lastRecord) {
          sqlite.prepare(`
            UPDATE sfObjects
            SET
              syncDate = $syncDate,
              syncId = $syncId
            WHERE name == $name;
          `).run({
            name: sfObject.name,
            syncDate: DateTime.fromISO(lastRecord.SystemModstamp).toUTC().toISO(),
            syncId: lastRecord.Id,
          })
        }

        // Check for deletes
        let currentDeleteDate = parseSQLTimestamp(sfObject.deleteDate)
        currentDeleteDate = currentDeleteDate < DateTime.utc().minus({ days: 29 }) ? DateTime.utc().minus({ days: 29 }) : currentDeleteDate

        const res = await sf.sobject(sfObject.name).deleted(currentDeleteDate.toISO(), currentDeleteDate.plus({ day: 3 }).toISO())
        const deletedRecords = res.deletedRecords
        const latestDateCovered = res.latestDateCovered ? DateTime.fromISO(res.latestDateCovered) : null

        for (const item of deletedRecords) {
          for (const webhook of webhooks) {
            sqlite.prepare(`
              INSERT INTO webhookRequests
              (headers, data, nextRunDate, webhookId)
              VALUES
              ($headers, $data, $nextRunDate, $webhookId);
            `).run({
              headers: null,
              data: JSON.stringify({
                type: sfObject.name,
                id: item.id,
                action: `delete`,
                changes: null,
              }),
              nextRunDate: DateTime.utc().toISO(),
              webhookId: webhook.id,
            })
          }

          sqlite.prepare(`
            DELETE FROM sfRecords WHERE id = $id;
          `).run({ id: item.id })
        }

        let nextDeleteDate = currentDeleteDate.plus({ day: 3 })

        if (latestDateCovered) {
          nextDeleteDate = nextDeleteDate > latestDateCovered ? latestDateCovered : nextDeleteDate
        }

        sqlite.prepare(`
          UPDATE sfObjects
          SET deleteDate = $deleteDate
          WHERE name == $name;
        `).run({
          name: sfObject.name,
          deleteDate: nextDeleteDate.toUTC().toISO(),
        })
      }, { concurrency: 1 })
    } catch (err) {
      console.log(err)
    }

    lock.release()
  }

  return {
    scan,
  }
}
