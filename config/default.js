
// General Configuration
//
// options in this file are overidden by keys in local config file.

module.exports = {
  middleware: [
    `performance`,
    `body`,
    `httpError`,
    `session`,
    `router`,
    `nuxtRender`,
  ],
  koa: {
    proxy: true,
  },
  port: 8000,
  services: [
    `ifxLock`,
    `prisma`,
    `sqlite`,
    `nuxt`,
    `joi`,
    `salesforce`,
    `sfScanner`,
    `requestProcessor`,
    `cron`,
  ],
  servicesNoReload: [
    `prisma`,
    `sqlite`,
    `nuxt`,
    `cron`,
  ],
  session: {
    sessionCookieName: `auth.sfwebook.local`,
    sessionCookieMaxAge: 1000 * 60 * 60 * 24 * 365,
  },
}
