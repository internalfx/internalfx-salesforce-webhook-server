
<script>
import _ from 'lodash'
import { to, errMsg } from '../../lib/utils.js'
// import { log } from 'util'
import gql from 'graphql-tag'
import { mapActions, mapMutations } from 'vuex'

export default {
  layout: `login`,
  data: function () {
    return {
      error: null,
      password: null
    }
  },
  components: {
  },
  // layout: 'login',
  methods: {
    ...mapMutations({
      setState: `set`
    }),
    ...mapActions([
      `login`,
      `showAlert`,
      `showSnackbar`
    ]),
    submit: async function () {
      this.inFlight = true

      const res = await to(this.$apollo.mutate({
        mutation: gql`
          mutation ($password: String!) {
            login (password: $password)
          }
        `,
        variables: {
          password: this.password
        },
        refetchQueries: []
      }))

      if (res.isError) {
        console.log(errMsg(res))
        this.showAlert({ message: errMsg(res), color: `error` })
      } else {
        const data = _.get(res, `data.login`)
        this.login(data.token)
      }

      this.inFlight = false
    }
  }
}
</script>

<template>
  <v-container style="max-width: 400px;">
    <v-row class="mt-6 mb-7 align-center">
      <v-col class="d-flex">
        <h1>Login</h1>
      </v-col>
      <v-col cols="auto" class="d-flex justify-end">
      </v-col>
    </v-row>

    <v-alert class="my-6" :value="error != null" type="error">{{error}}</v-alert>

    <v-text-field v-model="password" label="Password" type="password" outlined @keydown.enter="submit" />

    <v-row class="align-center">
      <v-col cols="auto" class="d-flex">
        <v-btn x-large color="primary" @click="submit"><v-icon left>fa-sign-in-alt</v-icon> Login</v-btn>
      </v-col>
      <v-col cols="auto" class="d-flex">
        <!-- <v-btn text @click="resetPassword">Reset Password</v-btn> -->
      </v-col>
    </v-row>
  </v-container>
</template>

<style>

</style>
