
const jsforce = require(`jsforce`)
// const _ = require(`lodash`)
// let requestCount = 0

module.exports = async function (config) {
  const sf = new jsforce.Connection({ loginUrl: config.salesforce.loginUrl, logLevel: `FATAL` })

  await sf.login(config.salesforce.login, config.salesforce.password)

  return {
    sobject: function (...args) {
      // requestCount += 1
      // console.log(`API Calls = ${requestCount}   Limit = ${_.get(sf, `limitInfo.apiUsage.limit`)}   Used = ${_.get(sf, `limitInfo.apiUsage.used`)}`)
      return sf.sobject(...args)
    },
    query: function (...args) {
      // requestCount += 1
      // console.log(`API Calls = ${requestCount}   Limit = ${_.get(sf, `limitInfo.apiUsage.limit`)}   Used = ${_.get(sf, `limitInfo.apiUsage.used`)}`)
      return sf.query(...args)
    }
  }
}
