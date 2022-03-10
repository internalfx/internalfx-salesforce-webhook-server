
module.exports = async function (config) {
  const db = require(`better-sqlite3`)(`./ifx-sws.sqlite`, {
    fileMustExist: true,
    timeout: 30000,
  })

  db.pragma(`journal_mode = WAL`)
  db.pragma(`synchronous = FULL`)

  return db
}
