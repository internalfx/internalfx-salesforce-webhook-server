
import _ from 'lodash'
import Vue from 'vue'
import lodashGet from 'lodash/get'
import gql from 'graphql-tag'

Vue.prototype.get = lodashGet

_.mixin({ isPresent: _.negate(_.isEmpty) })

export default async function ({ app, env, store }, inject) {
  const res = await app.$gqlClient.query({
    query: gql`
      query loggedIn {
        loggedIn: loggedIn
      }
    `,
    fetchPolicy: `network-only`
  })

  store.commit(`set`, {
    loggedIn: res.data.loggedIn
  })
}
