
<script>
import { mapActions } from 'vuex'
import format from '~lib/format.js'
import { to, errMsg } from '~lib/utils.js'

export default {
  layout: `default`,
  fetch: async function () {
    const res = await this.$axios.post(`/api/sfobjects-list`, {
    })

    this.sfObjects = res.data.sfObjects
  },
  data: function () {
    return {
      inFlight: false,
      searchVar: ``,
      sfObjects: [],
      headers: [
        { text: `Object Name`, value: `name`, sortable: false },
        { text: `Enabled`, value: `enabled`, sortable: false },
        { text: `Sync Date`, value: `syncDate`, sortable: false },
        { text: `Actions`, value: `actions`, sortable: false, align: `right` },
      ],
    }
  },
  components: {
  },
  computed: {
  },
  methods: {
    ...format([
      `stringList`,
    ]),
    ...mapActions([
      `showConfirm`,
      `showSnackbar`,
    ]),
    onClickRow: function (item) {
      this.$router.push({ path: `/sfobjects/${item.id}/edit` })
    },
    updateSfObject: async function (data) {
      this.inFlight = true

      const res = await to(this.$axios.post(
        `/api/sfobjects-update`,
        data,
      ))

      if (res.isError) {
        this.showSnackbar({ message: errMsg(res), color: `error` })
      }

      this.$fetch()
      this.inFlight = false
    },
    destroySfObject: async function (item) {
      this.inFlight = true

      const choice = await this.showConfirm({
        title: `Are you sure?`,
        message: `This will be deleted!`,
      })

      if (choice === `yes`) {
        const res = await to(this.$axios.post(`/api/sfobjects-delete`, { id: item.id }))

        if (res.isError) {
          this.showSnackbar({ message: errMsg(res), color: `error` })
        } else {
          this.showSnackbar({ message: `Webhook deleted.`, color: `success` })
        }
      }

      this.$fetch()
      this.inFlight = false
    },
  },
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
      v-if="sfObjects"
      :headers="headers"
      :items="sfObjects"
      class="striped clickable"
      item-key="id"
      no-data-text="No SF Objects."
      :loading="inFlight"
      @click:row="onClickRow"
    >
      <template v-slot:item.enabled="{item}">
        <v-switch hide-details class="ma-0 py-1" @click.stop="updateSfObject({ id: item.id, enabled: !item.enabled })" :input-value="item.enabled" />
      </template>
      <template v-slot:item.actions="{item}">
        <v-tooltip top>
          <template v-slot:activator="{on}">
            <span v-on="on">
              <v-btn @click.stop text fab small class="ma-0 mr-2" :to="{path: `/sfobjects/${item.id}/edit`}">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </span>
          </template>
          <span>Edit</span>
        </v-tooltip>
        <v-tooltip top>
          <template v-slot:activator="{on}">
            <span v-on="on">
              <v-btn @click.stop="destroySfObject(item)" text fab small color="error" class="ma-0 mr-2">
                <v-icon>mdi-delete</v-icon>
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
