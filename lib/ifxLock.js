import _ from 'lodash'
// import crypto from 'crypto'
// const diff = require(`deep-diff`)
// const dataDelimiter = `-=DO NOT EDIT BELOW=-`
// const moment = require(`moment`)

const locks = {}

const isLocked = function (lock) {
  if (lock == null) {
    return false
  }

  if (lock.queue == null) {
    return false
  }

  return true
}

const destroyLock = function (name) {
  locks[name] = undefined
}

const findLock = function (name) {
  if (locks[name] == null) {
    locks[name] = {
      timer: null,
      queue: null
    }
  }

  return locks[name]
}

export const failLock = function (name, expiration = 60 * 1000) {
  const lock = findLock(name)
  console.log(`++++ LOCK SYSTEM ++++ call failLock ${name}`)
  if (isLocked(lock)) {
    console.log(`++++ LOCK SYSTEM ++++ denied lock ${name}`, lock)
    throw new Error(`Failed to get lock: "${name}"`)
  } else {
    console.log(`++++ LOCK SYSTEM ++++ acquired lock ${name}`)
    const lock = findLock(name)
    lock.timer = setTimeout(expireLock(name), expiration)
    lock.queue = []
  }
}

export const awaitLock = function (name, expiration = 60 * 1000) {
  const lock = findLock(name)
  if (isLocked(lock)) {
    const ticket = {
      expiration,
      promise: new Promise(function (resolve, reject) {
        ticket.resolve = resolve
        ticket.reject = reject
      })
    }

    lock.queue.push(ticket)

    return ticket.promise
  } else {
    lock.timer = setTimeout(expireLock(name), expiration)
    lock.queue = []
  }
}

export const renewLock = function (name, expiration = 60 * 1000) {
  console.log(`++++ LOCK SYSTEM ++++ call renewLock ${name}`)
  const lock = findLock(name)
  if (lock.timer) { clearTimeout(lock.timer) }
  lock.timer = setTimeout(expireLock(name), expiration)
  console.log(`++++ LOCK SYSTEM ++++ renewed lock ${name}`, lock)
}

export const releaseLock = function (name) {
  const lock = findLock(name)
  console.log(`++++ LOCK SYSTEM ++++ call releaseLock ${name}`)

  if (isLocked(lock) && lock.queue.length > 0) {
    if (lock.timer) { clearTimeout(lock.timer) }
    const ticket = lock.queue.shift()
    lock.timer = setTimeout(expireLock(name), ticket.expiration)
    ticket.resolve()
  } else {
    destroyLock(name)
  }
}

const expireLock = function (name) {
  return function () {
    releaseLock(name)
  }
}
