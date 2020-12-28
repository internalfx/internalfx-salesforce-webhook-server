
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

# Usage

## Add SalesForce objects that you would like to watch.

Click "SalesForce Objects" in the left hand menu.

![](https://raw.githubusercontent.com/internalfx/internalfx-salesforce-webhook-server/main/resources/blank_sfobjects.png)

Click the "add salesforce object" button on the top right.

![](https://raw.githubusercontent.com/internalfx/internalfx-salesforce-webhook-server/main/resources/form_sfobjects.png)

| Field | Description |
| --- | --- |
| Object Name | The API name in SalesForce |
| Enabled? | This enables/disables the sync with SalesForce |
| Sync Date | The server will query for all records that have been created or changed since this date. This date will move forward as the server runs. You can move this date back to force a sync of older records |

Click "Save" when you are done.

![](https://raw.githubusercontent.com/internalfx/internalfx-salesforce-webhook-server/main/resources/list_sfobjects.png)

## Add webhooks and subscribe to objects.

Click "Webhooks" in the left hand menu.

![](https://raw.githubusercontent.com/internalfx/internalfx-salesforce-webhook-server/main/resources/blank_webhooks.png)

Click the "create webhook" button on the top right.

![](https://raw.githubusercontent.com/internalfx/internalfx-salesforce-webhook-server/main/resources/form_webhooks.png)

| Field | Description |
| --- | --- |
| Name | A friendly name to remind you of what this webhook is for |
| URL | The URL the webhook will be "posted" to |
| Enabled? | This enables/disables the webhook |
| Object Interests | The webhooks will post changed for any SalesForce objects listed here |

Click "Save" when you are done.

![](https://raw.githubusercontent.com/internalfx/internalfx-salesforce-webhook-server/main/resources/list_webhooks.png)

## Profit!