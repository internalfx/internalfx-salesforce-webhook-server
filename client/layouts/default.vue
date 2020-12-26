<script>
import layoutDrawer from '../ui/layout/drawer.vue'
import layoutFooter from '../ui/layout/footer.vue'

export default {
  data: function () {
    return {
      navColor: `#606060`,
      updating: false
    }
  },
  components: {
    layoutDrawer,
    layoutFooter
  },
  computed: {
  },
  methods: {
    update: function () {
      this.updating = true
      navigator.serviceWorker.getRegistration().then(function (registration) {
        registration.unregister().then(function (boolean) {
          location.reload()
        })
      })
    }
  },
  mounted: function () {
  }
}
</script>

<template>
  <v-app>
    <layoutDrawer />

    <v-app-bar app clipped-left dark color="primary">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" v-show="$vuetify.breakpoint.smAndDown" class="mr-2" />
      <v-toolbar-title @click="$router.push('/webhooks')" class="clickable ml-0 pl-0">
        InternalFX SalesForce Webhook Server
      </v-toolbar-title>

      <v-spacer />
    </v-app-bar>

    <v-main class="mb-12">
      <nuxt :key="$route.fullPath"/>
    </v-main>

    <layoutFooter />
  </v-app>
</template>

<style lang="scss">
  .clickable {
    cursor: pointer;
  }

  .v-data-table.clickable tbody tr td {
    cursor: pointer;
  }

  .v-input__icon--clear, .v-chip__content {
    svg {
      -webkit-appearance: inherit !important;
      -moz-appearance: inherit !important;
    }
  }
</style>
