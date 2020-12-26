-- CreateTable
CREATE TABLE "sfObjects" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhookRequests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'post',
    "headers" TEXT,
    "data" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextRunDate" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'post',
    "enabled" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "webhookInterests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "webhookId" INTEGER NOT NULL,
    "sfObjectTypeId" INTEGER NOT NULL,

    FOREIGN KEY ("webhookId") REFERENCES "webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("sfObjectTypeId") REFERENCES "sfObjectTypes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sfObjectTypes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "syncDate" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "webhookInterests.sfObjectTypeId_webhookId_unique" ON "webhookInterests"("sfObjectTypeId", "webhookId");

-- CreateIndex
CREATE UNIQUE INDEX "sfObjectTypes.name_unique" ON "sfObjectTypes"("name");
