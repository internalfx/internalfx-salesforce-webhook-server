const { parentPort } = require(`worker_threads`)
const db = require(`better-sqlite3`)(`./ifx-sws.sqlite`, {
  fileMustExist: true,
  timeout: 30000
})

parentPort.on(`message`, function ({ sql, funcName, parameters }) {
  try {
    const result = db.prepare(sql)[funcName](...parameters)
    parentPort.postMessage(result)
  } catch (err) {
    throw new Error(err.stack)
  }
})
