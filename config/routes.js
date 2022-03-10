
module.exports = function (config) {
  const routes = {
    'get /api/config.js': `configController.config`,
    'get /api/status': `statusController.status`,

    'post /api/login': `loginController.login`,

    'post /api/webhooks-list': `webhooksController.list`,
    'post /api/webhooks-show': `webhooksController.show`,
    'post /api/webhooks-create': `webhooksController.create`,
    'post /api/webhooks-update': `webhooksController.update`,
    'post /api/webhooks-delete': `webhooksController.delete`,
    'post /api/webhooks-replay': `webhooksController.replay`,

    'post /api/sfobjects-list': `sfObjectsController.list`,
    'post /api/sfobjects-show': `sfObjectsController.show`,
    'post /api/sfobjects-create': `sfObjectsController.create`,
    'post /api/sfobjects-update': `sfObjectsController.update`,
    'post /api/sfobjects-delete': `sfObjectsController.delete`,

    'post /api/records-list': `recordsController.list`,
    'post /api/records-show': `recordsController.show`,

    'post /api/events-list': `eventsController.list`,

    'post /api/test': `eventsController.list`,
  }

  return routes
}
