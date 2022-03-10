
const joi = require(`joi`)

module.exports = function (config) {
  return joi.defaults((schema) => {
    if (schema.type === `string`) {
      return schema.empty([null, ``]).default(null)
    } else if (schema.type === `number`) {
      return schema.empty([null]).default(null)
    } else if (schema.type === `boolean`) {
      return schema.empty([null]).default(null)
    }

    return schema
  })
}
