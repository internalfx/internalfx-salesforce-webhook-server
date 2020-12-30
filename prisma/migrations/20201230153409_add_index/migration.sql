-- CreateIndex
CREATE INDEX "webhookRequests.webhookId_nextRunDate_id_index" ON "webhookRequests"("webhookId", "nextRunDate", "id");
