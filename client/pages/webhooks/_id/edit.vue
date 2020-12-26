
<script>
import { mapActions } from 'vuex'
import { to, errMsg } from '../../../../lib/utils.js'
import gql from 'graphql-tag'
import _ from 'lodash'

export default {
  layout: `default`,
  apollo: {
    record: {
      query: gql`
        query getWebhook ($id: Int!) {
          record: getWebhook (id: $id) {
            id
            name
            url
            method
            enabled
            webhookInterests
          }
        }
      `,
      variables: function () {
        return {
          id: parseInt(this.$route.params.id, 10)
        }
      },
      result: function (res) {
        this.webhook = _.omit(res.data.record, `__typename`)
      },
      fetchPolicy: `no-cache`
    },
    sfObjectTypes: {
      query: gql`
        query allSfObjectTypes {
          sfObjectTypes: allSfObjectTypes {
            name
          }
        }
      `
    }
  },
  data: function () {
    return {
      inFlight: false,
      webhook: null
    }
  },
  components: {
  },
  computed: {
  },
  methods: {
    ...mapActions([
      `showConfirm`,
      `showSnackbar`
    ]),
    save: async function () {
      this.inFlight = true
      const res = await to(this.$apollo.mutate({
        mutation: gql`
          mutation ($payload: WebhookInput!) {
            upsertWebhook (payload: $payload) {
              id
            }
          }
        `,
        variables: {
          payload: this.webhook
        },
        refetchQueries: [`allWebhooks`]
      }))

      if (res.isError) {
        this.showSnackbar({ message: errMsg(res), color: `error` })
      } else {
        this.showSnackbar({ message: `saved.`, color: `success` })
        this.$router.push(`/webhooks`)
      }

      this.inFlight = false
    }
  }
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
      :items="sfObjectTypes"
      :loading="$apollo.queries.sfObjectTypes.loading"
      label="Object Interests"
      item-text="name"
      multiple
      clearable
      outlined
    />

    <v-row>
      <v-col class="d-flex align-center">
        <v-btn x-large color="primary" :loading="inFlight" :disabled="inFlight" @click="save"><v-icon left>fa-check</v-icon> Save</v-btn>
        <v-btn class="ml-7" text color="secondary" @click="$router.go(-1)"><v-icon left>fa-times</v-icon> Cancel</v-btn>
      </v-col>
      <v-col cols="auto" class="d-flex align-center justify-end">
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
</style>
