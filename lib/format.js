
import numeral from 'numeral'
import moment from 'moment'
import _ from 'lodash'

const formatters = {
  bytes: function (value) {
    if (value == null) {
      return ``
    }
    return numeral(value).format(`0.0 b`)
  },
  date: function (value) {
    if (value == null) {
      return ``
    }
    return moment(value).format(`ll`)
  },
  dateTime: function (value) {
    if (value == null) {
      return `Never`
    }
    return moment(value).format(`ll LT`)
  },
  time: function (value) {
    if (value == null) {
      return ``
    }
    return moment(value, `HH:mm`).format(`h:mm a`)
  },
  dateTimeSeconds: function (value) {
    if (value == null) {
      return `Never`
    }
    return moment(value).format(`ll LTS`)
  },
  money: function (value) {
    if (value == null) {
      return ``
    }
    return numeral(value).format(`$0,000.00`)
  },
  percent: function (value) {
    if (value == null) {
      return ``
    }
    return numeral(value).format(`0%`)
  },
  truncate: function (value, length = 50) {
    if (value == null) {
      return ``
    }
    return _.truncate(value, { length: length })
  },
  capitalize: function (value) {
    return _.capitalize(value)
  },
  dataDisplay: function (value, length = 50) {
    return _.truncate(JSON.stringify(value), { length: length })
  },
  humanize: function (value) {
    if (value == null) {
      return ``
    }
    return _.capitalize(_.startCase(value))
  },
  convertBreaks: function (value) {
    if (value == null || !_.isString(value)) {
      return ``
    }
    return value.replace(/\n/g, `<br/>`)
  },
  stringList: function (value, max = 3) {
    if (value == null || _.isEmpty(value)) {
      return `None`
    } else if (_.isArray(value)) {
      if (value.length > max) {
        return value.slice(0, max).join(`,`) + `...`
      } else {
        return value.join(`,`)
      }
    }

    return `None`
  }
}

export default function (...formatterList) {
  const payload = {}

  formatterList.forEach(function (name) {
    if (formatters[name]) {
      payload[name] = formatters[name]
    }
  })

  return payload
}
