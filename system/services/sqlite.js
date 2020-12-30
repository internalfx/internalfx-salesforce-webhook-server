
const { Worker } = require(`worker_threads`)
const os = require(`os`)
const _ = require(`lodash`)
const queue = []
const workers = {}
const coreCount = os.cpus().length

module.exports = async function (config) {
  const db = require(`better-sqlite3`)(`./ifx-sws.sqlite`, {
    fileMustExist: true,
    timeout: 30000
  })

  db.pragma(`journal_mode = WAL`)
  db.pragma(`synchronous = FULL`)

  db.asyncPrepare = function (sql) {
    const exec = async function (funcName, ...parameters) {
      // console.log(arguments)
      const worker = await getWorker()

      return new Promise(function (resolve, reject) {
        worker.job = {
          resolve,
          reject
        }

        worker.worker.postMessage({ sql, funcName, parameters })
      })
    }

    return {
      run: exec.bind(null, `run`),
      get: exec.bind(null, `get`),
      all: exec.bind(null, `all`)
    }
  }

  const getWorker = function () {
    while (Object.values(workers).length < coreCount) {
      spawnWorker()
    }

    const readyWorker = Object.values(workers).find(function (worker) {
      return worker.ready === true && worker.job == null
    })

    if (readyWorker == null) {
      const ticket = {}

      return new Promise(function (resolve, reject) {
        ticket.resolve = resolve
        ticket.reject = reject

        queue.push(ticket)
      })
    } else {
      readyWorker.job = {}
      return readyWorker
    }
  }

  const spawnWorker = function () {
    const worker = new Worker(`./lib/sqliteWorker.js`)

    const obj = {
      id: _.uniqueId(`worker_`),
      ready: false,
      error: null,
      job: null,
      worker
    }

    worker.on(`online`, function () {
      console.log(`SQLite Worker Online`)
      obj.ready = true
      const ticket = queue.shift()
      if (ticket) {
        obj.job = {}
        ticket.resolve(obj)
      }
    })

    worker.on(`message`, (result) => {
      console.log(`SQLite Worker Result`)
      obj.job.resolve(result)
      obj.job = null
      const ticket = queue.shift()
      if (ticket) {
        obj.job = {}
        ticket.resolve(obj)
      }
    })

    worker.on(`error`, (err) => {
      console.log(`SQLite Worker Error`)
      console.error(err.stack)
      obj.error = err
    })

    worker.on(`exit`, (code) => {
      console.log(`Worker Exit`)
      if (obj.job) {
        obj.job.reject(obj.error || new Error(`worker died`))
      }
      if (code !== 0) {
        console.error(`worker exited with code ${code}`)
      }

      workers[obj.id] = undefined
    })

    workers[obj.id] = obj
  }

  return db
}
