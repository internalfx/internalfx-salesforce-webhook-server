
const crypto = require(`crypto`)
const { DateTime } = require(`luxon`)
const _ = require(`lodash`)

let eventKeyCount = 0

const to = function (promise) {
  return promise.then(function (val) {
    return val || {}
  }).catch(function (err) {
    err.isError = true
    return err
  })
}

const getSQLTimestamp = function () {
  return DateTime.utc().toISO()
}

const stringifySQLTimestamp = function (dateTime) {
  return dateTime.toUTC().toISO()
}

const parseSQLTimestamp = function (text) {
  const value = DateTime.fromISO(text)

  if (!value.isValid) {
    return null
  }

  return value.toUTC()
}

const uniqueId = function (length = 10) {
  const chars = `1234567890BCDFGHJKMNPQRSTVWXYZ`
  const bytes = Array.from(crypto.randomBytes(length))

  const value = bytes.map(function (byte, idx) {
    return chars[byte % chars.length].toString()
  })

  return value.join(``)
}

const getEventKey = function () {
  eventKeyCount += 1
  if (eventKeyCount > 99999) {
    eventKeyCount = 1
  }
  return `${Date.now()}_${String(eventKeyCount).padStart(5, `0`)}`
}

const errMsg = function (err) {
  if (process.env.isDevelopment) {
    // console.log(JSON.stringify(err))
  }

  const messagePaths = [
    `graphQLErrors[0].message`,
    `networkError.result.errors[0].message`,
  ]
  let message = null

  for (const path of messagePaths) {
    message = _.get(err, path)

    if (message != null) {
      break
    }
  }

  return message
}

const cleanMutation = function (value) {
  if (value === null || value === undefined) {
    return value
  } else if (Array.isArray(value)) {
    return value.map(v => cleanMutation(v))
  } else if (typeof value === `object`) {
    const newObj = {}
    Object.entries(value).forEach(([key, v]) => {
      if (key !== `__typename`) {
        newObj[key] = cleanMutation(v)
      }
    })
    return newObj
  }

  return value
}

module.exports = {
  to,
  getSQLTimestamp,
  stringifySQLTimestamp,
  parseSQLTimestamp,
  uniqueId,
  getEventKey,
  errMsg,
  cleanMutation,
}
