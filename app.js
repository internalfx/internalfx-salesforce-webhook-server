
const substruct = require(`./substruct.js`)
const path = require(`path`)
const configPath = path.join(process.cwd(), `config.js`)
const userConfig = require(configPath)

substruct.configure({
  ...userConfig,
  building: true,
  runDir: process.cwd(),
  appDir: __dirname,
  nodePath: process.env.NODE_PATH ? process.env.NODE_PATH : `node`,
})

const main = async function () {
  await substruct.load()
  await substruct.start()

  console.log(`Server Started...`)
}

main().catch(function (err) {
  console.log(err)
})
