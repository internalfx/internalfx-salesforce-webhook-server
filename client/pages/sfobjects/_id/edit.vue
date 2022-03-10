
<script>
import { mapActions, mapState } from 'vuex'
import { to, errMsg } from '~lib/utils.js'
import _ from 'lodash'
import { DateTime } from 'luxon'

export default {
  layout: `default`,
  fetch: async function () {
    const res = await this.$axios.post(`/api/sfobjects-show`, { id: this.$route.params.id })
    this.sfObject = res.data.sfObject
  },
  data: function () {
    return {
      inFlight: false,
      sfObject: null,
      dateModal: false,
      date: new Date().toISOString().substr(0, 10),
    }
  },
  components: {
  },
  computed: {
    ...mapState({
      baseURL: state => state.baseURL,
    }),
    pickerValue: {
      get: function () {
        return DateTime.fromISO(this.sfObject.syncDate).toLocal().toISODate()
      },
      set: function (value) {
        this.sfObject.syncDate = DateTime.fromISO(value).toUTC().toISO()
      },
    },
  },
  methods: {
    ...mapActions([
      `showConfirm`,
      `showSnackbar`,
    ]),
    save: async function () {
      this.inFlight = true

      const res = await to(this.$axios.post(
        `/api/sfobjects-update`,
        _.pick(this.sfObject, [
          `id`,
          `name`,
          `enabled`,
          `syncDate`,
        ]),
      ))

      if (res.isError) {
        this.showSnackbar({ message: errMsg(res), color: `error` })
      } else {
        this.showSnackbar({ message: `saved.`, color: `success` })
        this.$router.push(`/sfobjects`)
      }

      this.inFlight = false
    },
  },
}

</script>

<template>
  <v-container v-if="sfObject">
    <v-row class="mt-6 mb-7 align-center">
      <v-col class="d-flex">
        <h1>Edit SalesForce Object</h1>
      </v-col>
      <v-col cols="auto" class="d-flex justify-end">
      </v-col>
    </v-row>

    <v-text-field readonly :value="sfObject.name" outlined label="Object Name" />
    <v-switch v-model="sfObject.enabled" label="Enabled" class="ma-0 py-1" />
    <v-dialog
      ref="dialog"
      v-model="dateModal"
      :return-value.sync="pickerValue"
      persistent
      width="290px"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-text-field
          v-model="pickerValue"
          label="Sync Date"
          prepend-icon="fa-calendar"
          readonly
          v-bind="attrs"
          v-on="on"
        ></v-text-field>
      </template>
      <v-date-picker v-model="pickerValue" scrollable>
        <v-spacer></v-spacer>
        <v-btn text color="primary" @click="dateModal = false">Cancel</v-btn>
        <v-btn text color="primary" @click="$refs.dialog.save(pickerValue)">OK</v-btn>
      </v-date-picker>
    </v-dialog>

    <v-row>
      <v-col class="d-flex align-center">
        <v-btn x-large color="primary" :loading="inFlight" :disabled="inFlight" @click="save"><v-icon left>mdi-check</v-icon> Save</v-btn>
        <v-btn class="ml-7" text color="secondary" @click="$router.go(-1)"><v-icon left>mdi-close</v-icon> Cancel</v-btn>
      </v-col>
      <v-col cols="auto" class="d-flex align-center justify-end">
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
</style>
