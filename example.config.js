
// Server Config
module.exports = {

  // baseURL for client access eg. https://ifxsws.example.com
  baseURL: `http://localhost:8000`,
  port: 8000,

  // CHANGE THIS!!!!
  // You should make this at LEAST 10 characters in length.
  password: `password`,

  // Cron schedule for webhooks
  webhookCron: `*/20 * * * * *`,

  salesforce: {
    // DEV ORG
    // loginUrl: 'https://test.salesforce.com',
    // Salesforce username
    // login: `user@example.com`,
    // Salesforce password (and security token)
    // password: `********************` + `********************`

    // PROD ORG
    loginUrl: `https://login.salesforce.com`,
    // Salesforce username
    login: `user@example.com`,
    // Salesforce password (and security token)
    password: `********************` + `********************`
  }
}
