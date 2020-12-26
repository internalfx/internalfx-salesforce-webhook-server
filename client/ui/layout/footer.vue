<script>
// import _ from 'lodash'
import { mapState } from 'vuex'
import { mapFields } from 'vuex-map-fields'

export default {
  data: function () {
    return {
    }
  },
  components: {
  },
  computed: {
    ...mapState({
      alert: state => state.alert,
      confirm: state => state.confirm
    }),
    ...mapFields({
      snackbarShow: `snackbar.show`,
      snackbarColor: `snackbar.color`,
      snackbarMessage: `snackbar.message`
    }),
    showAlert: {
      get: function () {
        return this.alert.resolve != null
      },
      set: function (val) {
        this.alert.resolve(`close`)
      }
    },
    showConfirm: {
      get: function () {
        return this.confirm.resolve != null
      },
      set: function (val) {
      }
    },
    showSnackbar: {
      get: function () {
        return this.snackbar != null
      },
      set: function (val) {
      }
    }
  },
  methods: {
  },
  mounted: function () {
  }
}
</script>

<template>
  <div>
    <v-dialog v-model="showAlert" max-width="450" persistent>
      <v-card>
        <v-card-title class="headline error lighten-2 white--text mb-4" primary-title>
          {{alert.title}}
        </v-card-title>

        <v-card-text>
          {{alert.message}}
        </v-card-text>

        <v-card-actions>
          <v-btn text @click="alert.resolve('ok')">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showConfirm" max-width="350" persistent>
      <v-card>
        <v-card-title class="headline" primary-title>
          {{confirm.title}}
        </v-card-title>

        <v-card-text>
          {{confirm.message}}
        </v-card-text>

        <v-card-actions>
          <v-btn x-large color="primary" @click="confirm.resolve('yes')"><v-icon left>fa-check</v-icon> Yes</v-btn>
          <v-btn class="ml-7" text color="secondary" @click="confirm.resolve('no')"><v-icon left>fa-times</v-icon> No</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbarShow"
      :color="snackbarColor"
      bottom
      multi-line
      :timeout="4000"
    >
      {{ snackbarMessage }}
      <v-btn text @click="snackbarShow = false">
        Close
      </v-btn>
    </v-snackbar>
  </div>
</template>

<style lang="scss">
</style>
