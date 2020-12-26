
import _ from 'lodash'
import crypto from 'crypto'
import { DateTime } from 'luxon'

export const to = function (promise) {
  return promise.then(function (val) {
    return val || {}
  }).catch(function (err) {
    err.isError = true
    return err
  })
}

export const getSQLTimestamp = function () {
  return DateTime.utc().toISO()
}

export const stringifySQLTimestamp = function (dateTime) {
  return dateTime.toUTC().toISO()
}

export const parseSQLTimestamp = function (text) {
  return DateTime.fromISO(text).toUTC()
}

export const uniqueId = function (length = 10) {
  const chars = `1234567890BCDFGHJKMNPQRSTVWXYZ`
  const bytes = Array.from(crypto.randomBytes(length))

  const value = bytes.map(function (byte, idx) {
    return chars[byte % chars.length].toString()
  })

  return value.join(``)
}

export const errMsg = function (err) {
  if (process.env.isDevelopment) {
    // console.log(JSON.stringify(err))
  }

  const messagePaths = [
    `graphQLErrors[0].message`,
    `networkError.result.errors[0].message`
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

export const cleanMutation = function (value) {
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

