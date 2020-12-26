
<script>
import { mapActions } from 'vuex'
import format from '../../../lib/format.js'
import { to, errMsg } from '../../../lib/utils.js'
import gql from 'graphql-tag'
// import _ from 'lodash'

export default {
  layout: `default`,
  apollo: {
    sfObjectTypes: {
      query: gql`
        query allSfObjectTypes {
          sfObjectTypes: allSfObjectTypes {
            id
            name
            enabled
            syncDate
          }
        }
      `,
      fetchPolicy: `network-only`
    }
  },
  data: function () {
    return {
      searchVar: ``,
      headers: [
        { text: `ID`, value: `id`, sortable: false },
        { text: `Object Name`, value: `name`, sortable: false },
        { text: `Enabled`, value: `enabled`, sortable: false },
        { text: `Sync Date`, value: `syncDate`, sortable: false },
        { text: `Actions`, value: `actions`, sortable: false, align: `right` }
      ]
    }
  },
  components: {
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
      this.$router.push({ path: `/sfobjects/${item.id}/edit` })
    },
    upsertSfObjectType: async function (data) {
      this.inFlight = true
      const res = await to(this.$apollo.mutate({
        mutation: gql`
          mutation ($payload: sfObjectTypeInput!) {
            upsertSfObjectType (payload: $payload) {
              id
            }
          }
        `,
        variables: {
          payload: data
        },
        refetchQueries: [`allSfObjectTypes`]
      }))

      if (res.isError) {
        this.showSnackbar({ message: errMsg(res), color: `error` })
      }

      this.inFlight = false
    },
    destroySfObjectType: async function (item) {
      this.inFlight = true

      const choice = await this.showConfirm({
        title: `Are you sure?`,
        message: `This will be deleted!`
      })

      if (choice === `yes`) {
        const res = await to(this.$apollo.mutate({
          mutation: gql`
            mutation ($id: Int!) {
              destroySfObjectType (id: $id)
            }
          `,
          variables: {
            id: item.id
          },
          refetchQueries: [`allSfObjectTypes`]
        }))

        if (res.isError) {
          this.showSnackbar({ message: errMsg(res), color: `error` })
        } else {
          this.showSnackbar({ message: `SalesForce Object deleted.`, color: `success` })
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
        <h1>SalesForce Objects</h1>
      </v-col>
      <v-col cols="auto" class="d-flex justify-end">
        <v-btn to="/sfobjects/create">Add SalesForce Object</v-btn>
      </v-col>
    </v-row>

    <v-data-table
      v-if="sfObjectTypes"
      :headers="headers"
      :items="sfObjectTypes"
      class="striped clickable"
      item-key="id"
      no-data-text="No SF Object Types."
      :loading="$apollo.queries.sfObjectTypes.loading"
      @click:row="onClickRow"
    >
      <template v-slot:item.enabled="{item}">
        <v-switch hide-details class="ma-0 py-1" @click.stop="upsertSfObjectType({ id: item.id, enabled: !item.enabled })" :input-value="item.enabled" />
      </template>
      <template v-slot:item.actions="{item}">
        <v-tooltip top>
          <template v-slot:activator="{on}">
            <span v-on="on">
              <v-btn @click.stop text fab small class="ma-0 mr-2" :to="{path: `/sfobjects/${item.id}/edit`}">
                <v-icon>fa-edit</v-icon>
              </v-btn>
            </span>
          </template>
          <span>Edit</span>
        </v-tooltip>
        <v-tooltip top>
          <template v-slot:activator="{on}">
            <span v-on="on">
              <v-btn @click.stop="destroySfObjectType(item)" text fab small color="error" class="ma-0 mr-2">
                <v-icon>fa-trash-alt</v-icon>
              </v-btn>
            </span>
          </template>
          <span>Delete</span>
        </v-tooltip>
      </template>
    </v-data-table>

    <v-row class="align-center">
      <v-col class="pb-0">
      </v-col>
      <v-col class="pb-0">
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
</style>
