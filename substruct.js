
const _ = require(`lodash`)
const Promise = require(`bluebird`)
const path = require(`path`)
const Koa = require(`koa`)
const koa = new Koa()
const cors = require(`@koa/cors`)
const ratelimit = require(`koa-ratelimit`)
const ratelimitDB = new Map()
const requireAll = require(`require-all`)
const fs = require(`fs`)
let configured = false
let loaded = false
const substruct = {}
const config = require(`./config/default.js`)
const http = require(`http`)
const https = require(`https`)
const argv = require(`minimist`)(process.argv.slice(2))
const { pathToRegexp } = require(`path-to-regexp`)
const chokidar = require(`chokidar`)

const collapse = function (obj, depth, delimiter = `.`) {
  const output = {}
  depth = depth || []
  Object.keys(obj).forEach(function (key) {
    const val = obj[key]
    if (_.isFunction(val) || _.isString(val) || _.isArray(val) || _.isBoolean(val)) {
      Object.assign(output, { [depth.concat([key]).join(delimiter)]: val })
    } else if (_.isObject(val)) {
      Object.assign(output, collapse(val, depth.concat([key]), delimiter))
    }
  })
  return output
}

substruct.configure = function (manualConfig = {}) {
  if (configured) {
    throw new Error(`Substruct has already been configured! You can only call substruct.configure() once before start()`)
  }

  const appDir = manualConfig.appDir || process.cwd()
  const configDir = path.join(appDir, `config`)

  if (fs.existsSync(path.join(configDir, `default.js`))) {
    Object.assign(config, require(path.join(configDir, `default.js`)))
  }

  config.env = `development`

  if (argv.prod === true) {
    config.env = `production`
    config.build = true
    config.building = true
  }

  config.argv = argv
  config.isDevelopment = config.env === `development`
  config.isProduction = config.env === `production`

  if (config.isDevelopment) {
    config.build = true
    config.building = true
  } else if (config.isProduction === true) {
    // config.build = argv.build
    // config.building = argv.build
  }

  const envConfig = (function () {
    const prodEnvPath = path.join(configDir, `env`, `prod.js`)
    const devEnvPath = path.join(configDir, `env`, `dev.js`)

    if (config.env === `production` && fs.existsSync(prodEnvPath)) {
      return require(prodEnvPath)
    } else if (config.env === `development` && fs.existsSync(devEnvPath)) {
      return require(devEnvPath)
    } else {
      return {}
    }
  }())

  Object.assign(config, envConfig, manualConfig)

  config.appDir = appDir
  config.apiDir = path.join(appDir, `api`)
  config.controllerDir = path.join(config.apiDir, `controllers`)
  config.confDir = path.join(appDir, `config`)
  config.sysDir = path.join(appDir, `system`)

  koa.proxy = config.koa.proxy

  configured = true

  return config
}

substruct.load = async function () {
  if (configured !== true) {
    throw new Error(`Substruct has not been configured yet! Call substruct.configure() before load()`)
  }

  if (loaded) {
    throw new Error(`Substruct has already been loaded! You can only call substruct.load() once before start()`)
  }

  await substruct._loadServices()
  await substruct._loadMiddleware()
  await substruct._loadControllers()

  loaded = true

  if (config.isDevelopment) {
    // console.log(`Watching files...`)
    // console.log(require.cache)
    const watcher = chokidar.watch([
      path.join(config.confDir, `routes.js`),
      config.apiDir,
      config.sysDir,
    ], {
      ignored: /[/\\]\./,
      persistent: true,
      ignoreInitial: true,
      usePolling: true,
      interval: 300,
      binaryInterval: 300,
    })

    watcher.on(`all`, async function (event, filePath) {
      if ([`change`].includes(event)) {
        console.log(`Substruct hot reload.`, filePath)

        const cacheKey = path.resolve(filePath)
        delete require.cache[cacheKey]

        if (cacheKey.includes(`/system/services/`)) {
          for (const key of Object.keys(require.cache)) {
            if (key.includes(`/api/controllers/`)) {
              delete require.cache[key]
            }
          }
        }

        await substruct._loadServices()
        // await substruct._loadMiddleware()
        await substruct._loadControllers()
      }
    })
  }
}

substruct._loadServices = async function () {
  const services = requireAll({
    dirname: path.join(config.sysDir, `services`),
  })

  for (const name of config.services) {
    if (loaded && config.servicesNoReload.includes(name)) {
      continue
    }

    if (services[name] == null) {
      throw new Error(`"${name}" service not found.`)
    }
    const fn = services[name]
    substruct.services[name] = await Promise.resolve(fn(config))
  }
}

substruct._loadMiddleware = async function () {
  koa.use(ratelimit({
    driver: `memory`,
    db: ratelimitDB,
    duration: 60000,
    errorMessage: `Too many requests`,
    id: (ctx) => ctx.ip,
    headers: {
      remaining: `Rate-Limit-Remaining`,
      reset: `Rate-Limit-Reset`,
      total: `Rate-Limit-Total`,
    },
    max: 300,
    disableHeader: false,
    whitelist: (ctx) => {
      // some logic that returns a boolean
    },
    blacklist: (ctx) => {
      // some logic that returns a boolean
    },
  }))
  koa.use(cors(config.koa.cors))

  const middleware = requireAll({
    dirname: path.join(config.sysDir, `middleware`),
  })

  for (const name of config.middleware) {
    if (middleware[name] == null) {
      throw new Error(`"${name}" middleware not found.`)
    }
    koa.use(await Promise.resolve(middleware[name](config)))
  }
}

substruct._loadControllers = async function () {
  substruct.routeConfig = require(path.join(config.confDir, `routes.js`))(config)

  substruct.controllers = collapse(requireAll({
    dirname: config.controllerDir,
    filter: /(.+Controller)\.js$/,
    recursive: true,
  }))

  substruct.routeMap = Object.entries(substruct.routeConfig).map(function ([address, target], idx) {
    const route = {}
    const [method, path] = address.split(` `)

    route.method = method.toLowerCase()
    route.path = path
    route.controller = target
    route.keys = []
    route.re = pathToRegexp(route.path, route.keys)

    return route
  })
}

substruct.start = async function () {
  if (configured !== true) {
    throw new Error(`Substruct has not been configured yet! Call substruct.configure() and substruct.load() before start()`)
  }

  if (loaded !== true) {
    throw new Error(`Substruct has not been loaded yet! Call substruct.load() before start()`)
  }

  console.log(`****************** SERVER START *****************`)
  console.log(`*  env = '${config.env}'`)
  console.log(`*  port = ${config.port}`)
  console.log(`*************************************************`)

  if (config.isDevelopment) {
    const key = fs.readFileSync(`../localhost-key.pem`)
    const cert = fs.readFileSync(`../localhost.pem`)
    substruct.server = https.createServer({ key: key, cert: cert }, koa.callback())
  } else if (config.isProduction === true) {
    substruct.server = http.createServer(koa.callback())
  }

  substruct.server.listen({
    port: config.port,
    host: config.host,
  })

  substruct.status = `running`

  return substruct
}

substruct.stop = async function () {
  console.log(`Stopping server...`)
  substruct.server.close()
  substruct.status = `stopped`
}

substruct.status = `stopped`
substruct.config = config
substruct.koa = koa
substruct.meta = {}
substruct.services = {}
substruct.controllers = {}

module.exports = substruct
