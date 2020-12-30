
<script>
import { mapActions } from 'vuex'
import format from '../../../lib/format.js'
import { to, errMsg } from '../../../lib/utils.js'
import gql from 'graphql-tag'
// import _ from 'lodash'

import webhookReplayDialog from '../../ui/webhookReplayDialog.vue'

export default {
  layout: `default`,
  apollo: {
    allWebhooks: {
      query: gql`
        query allWebhooks (
          $page: Int,
          $pageSize: Int
        ) {
          allWebhooks: allWebhooks (
            page: $page,
            pageSize: $pageSize
          ) {
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
          page: this.page,
          pageSize: this.pageSize,
          search: this.searchVar
        }
      },
      fetchPolicy: `network-only`
    }
  },
  data: function () {
    return {
      replayWebhookId: null,
      replayWebhookDialog: false,
      headers: [
        { text: `Name`, value: `name`, sortable: false },
        { text: `URL`, value: `url`, sortable: false },
        { text: `Enabled`, value: `enabled`, sortable: false },
        { text: `Object Interests`, value: `webhookInterests`, sortable: false },
        { text: `Actions`, value: `actions`, sortable: false, align: `right` }
      ]
    }
  },
  components: {
    webhookReplayDialog
  },
  computed: {
  },
  methods: {
    ...format([
      `stringList`
    ]),
    ...mapActions([
      `showConfirm`,
      `showSnackbar`
    ]),
    onClickRow: function (item) {
      this.$router.push({ path: `/webhooks/${item.id}/edit` })
    },
    replayWebhook: async function (isoDate) {
      this.inFlight = true
      const res = await to(this.$apollo.mutate({
        mutation: gql`
          mutation ($id: Int!, $syncDate: DateTime!) {
            replayWebhook (id: $id, syncDate: $syncDate)
          }
        `,
        variables: {
          id: this.replayWebhookId,
          syncDate: isoDate
        },
        refetchQueries: [`allWebhooks`]
      }))

      if (res.isError) {
        this.showSnackbar({ message: errMsg(res), color: `error` })
      }

      this.inFlight = false
    },
    upsertWebhook: async function (data) {
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
          payload: data
        },
        refetchQueries: [`allWebhooks`]
      }))

      if (res.isError) {
        this.showSnackbar({ message: errMsg(res), color: `error` })
      }

      this.inFlight = false
    },
    destroyWebhook: async function (data) {
      this.inFlight = true

      const choice = await this.showConfirm({
        title: `Are you sure?`,
        message: `This will be deleted!`
      })

      if (choice === `yes`) {
        const res = await to(this.$apollo.mutate({
          mutation: gql`
            mutation ($id: Int!) {
              destroyWebhook (id: $id)
            }
          `,
          variables: {
            id: data.id
          },
          refetchQueries: [`allWebhooks`]
        }))

        if (res.isError) {
          this.showSnackbar({ message: errMsg(res), color: `error` })
        } else {
          this.showSnackbar({ message: `Webhook deleted.`, color: `success` })
        }
      }

      this.inFlight = false
    }
  }
}

</script>

<template>
  <v-container>
    <v-row class="mt-6 mb-7 align-center">
      <v-col class="d-flex">
        <h1>Webhooks</h1>
      </v-col>
      <v-col cols="auto" class="d-flex justify-end">
        <v-btn to="/webhooks/create">Create webhook</v-btn>
      </v-col>
    </v-row>

    <v-data-table
      v-if="allWebhooks"
      :headers="headers"
      :items="allWebhooks"
      class="striped clickable"
      item-key="id"
      no-data-text="No webhooks."
      :loading="$apollo.queries.allWebhooks.loading"
      @click:row="onClickRow"
    >
      <template v-slot:item.name="{item}">
        <div class="collapse-wrapper">
          <div class="content">{{item.name}}</div>
          <div class="spacer">{{item.name.replaceAll(/.{0,2}/g, `_ `)}}</div>
          <span>&nbsp;</span>
        </div>
      </template>
      <template v-slot:item.url="{item}">
        <div class="collapse-wrapper">
          <div class="content">{{item.url}}</div>
          <div class="spacer">{{item.url.replaceAll(/.{0,2}/g, `_ `)}}</div>
          <span>&nbsp;</span>
        </div>
      </template>
      <template v-slot:item.enabled="{item}">
        <v-switch hide-details class="ma-0 py-1" @click.stop="upsertWebhook({ id: item.id, enabled: !item.enabled })" :input-value="item.enabled" />
      </template>
      <template v-slot:item.webhookInterests="{item}">
        <div class="collapse-wrapper">
          <div class="content">{{item.webhookInterests.join(`, `)}}</div>
          <div class="spacer">{{item.webhookInterests.join(`, `).replaceAll(/.{0,2}/g, `_ `)}}</div>
          <span>&nbsp;</span>
        </div>
      </template>
      <template v-slot:item.actions="{item}">
        <div style="white-space: nowrap;">
          <v-tooltip top>
            <template v-slot:activator="{on}">
              <span v-on="on">
                <v-btn @click.stop="replayWebhookId = item.id; replayWebhookDialog = true" text fab small class="ma-0 mr-2">
                  <v-icon>fa-history</v-icon>
                </v-btn>
              </span>
            </template>
            <span>Replay</span>
          </v-tooltip>
          <v-tooltip top>
            <template v-slot:activator="{on}">
              <span v-on="on">
                <v-btn @click.stop text fab small class="ma-0 mr-2" :to="{path: `/webhooks/${item.id}/edit`}">
                  <v-icon>fa-edit</v-icon>
                </v-btn>
              </span>
            </template>
            <span>Edit</span>
          </v-tooltip>
          <v-tooltip top>
            <template v-slot:activator="{on}">
              <span v-on="on">
                <v-btn @click.stop="destroyWebhook(item)" text fab small color="error" class="ma-0 mr-2">
                  <v-icon>fa-trash-alt</v-icon>
                </v-btn>
              </span>
            </template>
            <span>Delete</span>
          </v-tooltip>
        </div>
      </template>
    </v-data-table>

    <v-row class="align-center">
      <v-col class="pb-0">
      </v-col>
      <v-col class="pb-0">
      </v-col>
    </v-row>

    <webhookReplayDialog v-model="replayWebhookDialog" @execute="replayWebhook($event)" />

  </v-container>
</template>

<style lang="scss" scoped>
  .collapse-wrapper {
    position: relative;
    overflow: hidden;

    .content {
      position: absolute;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .spacer {
      height: 0;
      line-height: 0;
      overflow: hidden;
    }
  }

</style>
