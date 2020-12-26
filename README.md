
# InternalFX SalesForce Webhook Server

A simple node project that watches your SalesForce objects for changes and sends webhooks to the URLs of your choice.

### Features

- Can watch any SalesForce object, even custom ones.
- Timer can be adjusted so you can control the balance between the time delay of webhooks, and the number of API calls consumed.
- Webhooks are automatically retried with exponential back-off.
- Webhook payload includes the record ID, the object name, the exact keys changed, and a copy of the full record.

## Getting Started

1. Clone latest repo
```
git clone https://github.com/internalfx/internalfx-salesforce-webhook-server.git
cd internalfx-salesforce-webhook-server
```

2. Get dependencies
```
yarn
```

3. Rename example config file and edit to your liking.
```
rename example.config.js to config.js
```

4. Run database migrations
```
npx prisma migrate deploy --preview-feature
```

5. Start server!
```
node app.js
```