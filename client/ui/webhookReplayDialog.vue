
<script>
import { mapActions } from 'vuex'
import { DateTime } from 'luxon'

export default {
  data: function () {
    return {
      luxonValue: DateTime.utc().startOf(`minute`)
    }
  },
  props: {
    value: Boolean
  },
  components: {
  },
  computed: {
    showModal: {
      get: function () {
        return !!this.value
      },
      set: function (value) {
        this.$emit(`input`, !!value)
      }
    },
    syncDate: {
      get: function () {
        return this.luxonValue.toLocal().toISODate()
      },
      set: function (value) {
        const values = DateTime.fromISO(value).toUTC().toObject()
        this.luxonValue = this.luxonValue.set({ year: values.year, month: values.month, day: values.day })
      }
    },
    syncTime: {
      get: function () {
        return this.luxonValue.toLocal().toFormat(`HH:mm`)
      },
      set: function (value) {
        const values = DateTime.fromFormat(value, `HH:mm`).toUTC().toObject()
        this.luxonValue = this.luxonValue.set({ hour: values.hour, minute: values.minute })
      }
    },
    dialogTransition: function () {
      return this.$vuetify.breakpoint.smAndDown ? `dialog-bottom-transition` : `dialog-transition`
    }
  },
  methods: {
    ...mapActions([
      `showSnackbar`
    ]),
    execute: function () {
      this.$emit(`execute`, this.luxonValue.toISO())
      this.luxonValue = DateTime.utc().startOf(`minute`)
      this.showModal = null
    }
  },
  mounted: function () {
  }
}
</script>

<template>
  <v-dialog v-model="showModal" scrollable dense :fullscreen="$vuetify.breakpoint.smAndDown" :transition="dialogTransition" max-width="700">
    <v-card>
      <v-card-title class="headline grey lighten-2 px-3 py-1">
        Replay Webhook

        <v-spacer />

        <v-btn icon @click.stop="showModal = null">
          <v-icon>fa-times</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-8">
        <v-date-picker v-model="syncDate" />
        <v-time-picker v-model="syncTime" />
      </v-card-text>

      <v-card-actions>
        <v-btn color="secondary" @click="showModal = null"><v-icon left>fa-times</v-icon> Cancel</v-btn>
        <v-spacer/>
        <v-btn color="primary" @click="execute"><v-icon left>fa-check</v-icon> Execute</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
</style>
