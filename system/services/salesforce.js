
const jsforce = require(`jsforce`)
const _ = require(`lodash`)
let requestCount = 0

module.exports = async function (config) {
  const sf = new jsforce.Connection({ loginUrl: config.salesforce.loginUrl, logLevel: `FATAL` })

  await sf.login(config.salesforce.login, config.salesforce.password)

  const checkMax = function () {
    if (_.get(sf, `limitInfo.apiUsage.used`) >= _.get(sf, `limitInfo.apiUsage.limit`)) {
      throw new Error(`SalesForce API call limit reached!!!`)
    }
  }

  return {
    sobject: function (...args) {
      console.log(`SF API Calls = ${requestCount}   Limit = ${_.get(sf, `limitInfo.apiUsage.limit`)}   Used = ${_.get(sf, `limitInfo.apiUsage.used`)}`)
      checkMax()
      requestCount += 1
      return sf.sobject(...args)
    },
    query: function (...args) {
      console.log(`SF API Calls = ${requestCount}   Limit = ${_.get(sf, `limitInfo.apiUsage.limit`)}   Used = ${_.get(sf, `limitInfo.apiUsage.used`)}`)
      checkMax()
      requestCount += 1
      return sf.query(...args)
    },
    ping: async function () {
      await sf.sobject(`Product2`).find().limit(1)
      console.log(`SF API Calls = ${requestCount}   Limit = ${_.get(sf, `limitInfo.apiUsage.limit`)}   Used = ${_.get(sf, `limitInfo.apiUsage.used`)}`)
    },
    clearCache: function () {
      sf.cache.clear()
    },
  }
}
