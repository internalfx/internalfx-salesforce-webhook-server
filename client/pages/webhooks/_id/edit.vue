
<script>
import { mapActions } from 'vuex'
import { to, errMsg } from '~lib/utils.js'
import _ from 'lodash'

export default {
  layout: `default`,
  fetch: async function () {
    const res2 = await this.$axios.post(`/api/sfobjects-list`)
    this.sfObjects = res2.data.sfObjects

    const res = await this.$axios.post(`/api/webhooks-show`, { id: this.$route.params.id })
    this.webhook = {
      ...res.data.webhook,
      webhookInterests: res.data.webhook.webhookInterests.map(i => _.get(i, `sfObject`)),
    }
  },
  data: function () {
    return {
      inFlight: false,
      webhook: null,
    }
  },
  components: {
  },
  computed: {
  },
  methods: {
    ...mapActions([
      `showConfirm`,
      `showSnackbar`,
    ]),
    save: async function () {
      this.inFlight = true

      const res = await to(this.$axios.post(
        `/api/webhooks-update`,
        this.webhook,
      ))

      if (res.isError) {
        this.showSnackbar({ message: errMsg(res), color: `error` })
      } else {
        this.showSnackbar({ message: `saved.`, color: `success` })
        this.$router.push(`/webhooks`)
      }

      this.inFlight = false
    },
  },
}

</script>

<template>
  <v-container v-if="webhook">
    <v-row class="mt-6 mb-7 align-center">
      <v-col class="d-flex">
        <h1>Edit Webhook</h1>
      </v-col>
      <v-col cols="auto" class="d-flex justify-end">
      </v-col>
    </v-row>

    <v-text-field v-model="webhook.name" label="Name" type="text" outlined />
    <v-text-field v-model="webhook.url" label="URL" type="text" outlined />
    <v-switch v-model="webhook.enabled" label="Enabled" class="ma-0 py-1" />
    <v-autocomplete
      v-model="webhook.webhookInterests"
      :items="sfObjects"
      :loading="inFlight"
      label="Object Interests"
      item-value="id"
      item-text="name"
      return-object
      multiple
      clearable
      outlined
    />

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
