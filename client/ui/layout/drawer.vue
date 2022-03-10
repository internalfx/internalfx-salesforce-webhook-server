<script>
// import _ from 'lodash'
import { mapActions } from 'vuex'
import { mapFields } from 'vuex-map-fields'

export default {
  data: function () {
    return {
      navColor: `#606060`,
    }
  },
  components: {
  },
  computed: {
    ...mapFields({
      drawer: `drawer`,
    }),
  },
  methods: {
    ...mapActions([
      `logout`,
    ]),
  },
  mounted: function () {
  },
}
</script>

<template>
  <div>
    <v-navigation-drawer
      app
      :value="drawer || $vuetify.breakpoint.mdAndUp"
      @input="drawer = $event"
      :temporary="$vuetify.breakpoint.smAndDown"
      clipped
      :mobile-breakpoint="'sm'"
    >
      <v-list>
        <v-list-item :color="navColor" to="/webhooks" nuxt>
          <v-list-item-action><v-icon>mdi-webhook</v-icon></v-list-item-action>
          <v-list-item-content><v-list-item-title>Webhooks</v-list-item-title></v-list-item-content>
        </v-list-item>
        <v-list-item :color="navColor" to="/sfobjects" nuxt>
          <v-list-item-action><v-icon>mdi-sitemap</v-icon></v-list-item-action>
          <v-list-item-content><v-list-item-title>SalesForce Objects</v-list-item-title></v-list-item-content>
        </v-list-item>
      </v-list>

      <v-divider/>

      <template v-slot:append>
        <v-list dense>
          <v-divider/>
          <v-list-item :color="navColor" @click="logout">
            <v-list-item-action>
              <v-icon>fa-sign-out-alt</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>
  </div>
</template>

<style lang="scss">
</style>
