
// import cron from 'node-cron'
import _ from 'lodash'
import Vue from 'vue'
import lodashGet from 'lodash/get'

Vue.prototype.get = lodashGet

_.mixin({ isPresent: _.negate(_.isEmpty) })

export default async function ({ app, env, store, $axios, route }, inject) {
  app.$axios.setBaseURL(window.ifxApp.baseURL)

  app.$axios.interceptors.response.use(function (response) {
    return response
  }, function (error) {
    error.message = error.response.data
    return Promise.reject(error)
  })

  const res = await $axios.get(`/api/status`, {
    progress: false,
    timeout: 5000,
  })

  store.commit(`set`, {
    baseURL: window.ifxApp.baseURL,
    loggedIn: res.data.loggedIn || false,
  })

  // Update route data in vuex
  app.router.beforeEach((to, from, next) => {
    store.commit(`set`, {
      route: to,
    })
    next()
  })
}
