/*
  Warnings:

  - Added the required column `webhookId` to the `webhookRequests` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_webhookRequests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'post',
    "headers" TEXT,
    "data" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextRunDate" DATETIME NOT NULL,
    "webhookId" INTEGER NOT NULL,

    FOREIGN KEY ("webhookId") REFERENCES "webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_webhookRequests" ("id", "url", "method", "headers", "data", "attempts", "nextRunDate") SELECT "id", "url", "method", "headers", "data", "attempts", "nextRunDate" FROM "webhookRequests";
DROP TABLE "webhookRequests";
ALTER TABLE "new_webhookRequests" RENAME TO "webhookRequests";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
