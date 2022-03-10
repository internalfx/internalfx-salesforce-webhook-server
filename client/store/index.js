
import _ from 'lodash'
import Promise from 'bluebird'
import { getField, updateField } from 'vuex-map-fields'
import Vue from 'vue'
import cookies from 'js-cookie'

export const strict = true

export const state = function () {
  return {
    baseURL: null,
    drawer: false,
    alert: {
      title: null,
      message: null,
      resolve: null,
    },
    loggedIn: false,
    confirm: {
      title: null,
      message: null,
      resolve: null,
    },
    snackbar: {
      show: false,
      color: `primary`,
      message: null,
    },
    route: {},
  }
}

export const mutations = {
  updateField,
  set: function (state, payload) {
    Object.entries(payload).forEach(function ([key, val]) {
      if (val === undefined) {
        val = null
      }

      if (_.get(state, key) === val) {
        return
      }

      let path = key.split(/(?:\.|\[)/)

      path = path.map(function (item) {
        if (item.substr(-1) === `]`) {
          return {
            type: `index`,
            value: parseInt(item.replace(`]`, ``), 10),
          }
        } else {
          return {
            type: `key`,
            value: item,
          }
        }
      })

      let obj = state

      for (let i = 0; i < path.length; i += 1) {
        const isLast = i >= path.length - 1
        const part = path[i]

        if (isLast) {
          part.nextType = null
        } else {
          part.nextType = path[i + 1].type
        }
      }

      for (const part of path) {
        if (part.nextType === null) {
          Vue.set(obj, part.value, val)
        } else if (_.has(obj, part.value) === false) {
          if (part.nextType === `index`) {
            Vue.set(obj, part.value, [])
          } else if (part.nextType === `key`) {
            Vue.set(obj, part.value, {})
          }
        }

        obj = _.get(obj, part.value)
      }
    })
  },
}

export const actions = {
  login: async function ({ state, commit }, token) {
    cookies.set(`auth.sfwebook.local`, token, { expires: 365 })
    commit(`set`, { loggedIn: true })

    this.$router.push(`/webhooks`)
  },
  logout: async function ({ state, commit }) {
    const res = await this.$gqlClient.mutate({
      // mutation: gql`
      //   mutation { logout }
      // `,
    })

    const result = _.get(res, `data.logout`)

    console.log(result)

    if (result) {
      cookies.remove(`auth.sfwebook.local`)
      commit(`set`, { loggedIn: false })
      this.$router.push(`/login`)
    }
  },

  showAlert: function ({ state, commit }, opts = {}) {
    let { title, message } = opts
    title = title || `Error`
    message = message || ``
    return new Promise(function (resolve) {
      commit(`set`, {
        'alert.title': title,
        'alert.message': message,
        'alert.resolve': resolve,
      })
    }).then(function (choice) {
      commit(`set`, {
        'alert.title': null,
        'alert.message': null,
        'alert.resolve': null,
      })

      return choice
    })
  },

  showConfirm: function ({ state, commit }, opts = {}) {
    let { title, message } = opts
    title = title || `Are you sure?`
    message = message || ``
    return new Promise(function (resolve) {
      commit(`set`, {
        'confirm.title': title,
        'confirm.message': message,
        'confirm.resolve': resolve,
      })
    }).then(function (choice) {
      commit(`set`, {
        'confirm.title': null,
        'confirm.message': null,
        'confirm.resolve': null,
      })

      return choice
    })
  },

  showSnackbar: function ({ state, commit }, payload) {
    let message = ``
    let color = `secondary`
    if (_.isString(payload)) {
      message = payload
    } else {
      message = payload.message
      color = payload.color
    }
    commit(`set`, {
      'snackbar.show': true,
      'snackbar.color': color,
      'snackbar.message': message,
    })
  },
}

export const getters = {
  getField,
}
