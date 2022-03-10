-- CreateTable
CREATE TABLE "sessions" (
    "token" TEXT NOT NULL PRIMARY KEY,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "events" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "changes" TEXT
);

-- CreateTable
CREATE TABLE "sfRecords" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "data" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "sfObjects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "syncDate" TEXT NOT NULL,
    "syncId" TEXT,
    "deleteDate" TEXT
);

-- CreateTable
CREATE TABLE "webhookRequests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "headers" TEXT,
    "data" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextRunDate" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    CONSTRAINT "webhookRequests_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhooks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'post',
    "enabled" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "webhookInterests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "webhookId" TEXT NOT NULL,
    "sfObjectId" TEXT NOT NULL,
    CONSTRAINT "webhookInterests_sfObjectId_fkey" FOREIGN KEY ("sfObjectId") REFERENCES "sfObjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "webhookInterests_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhooks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "events_type_timestamp_id_idx" ON "events"("type", "timestamp", "id");

-- CreateIndex
CREATE INDEX "events_timestamp_id_idx" ON "events"("timestamp", "id");

-- CreateIndex
CREATE INDEX "sfRecords_type_timestamp_id_idx" ON "sfRecords"("type", "timestamp", "id");

-- CreateIndex
CREATE INDEX "sfRecords_timestamp_id_idx" ON "sfRecords"("timestamp", "id");

-- CreateIndex
CREATE UNIQUE INDEX "sfObjects_name_key" ON "sfObjects"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sfObjects_slug_key" ON "sfObjects"("slug");

-- CreateIndex
CREATE INDEX "webhookRequests_webhookId_nextRunDate_id_idx" ON "webhookRequests"("webhookId", "nextRunDate", "id");

-- CreateIndex
CREATE UNIQUE INDEX "webhookInterests_sfObjectId_webhookId_key" ON "webhookInterests"("sfObjectId", "webhookId");
