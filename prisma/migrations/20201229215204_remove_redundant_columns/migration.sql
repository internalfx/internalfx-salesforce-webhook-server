/*
  Warnings:

  - You are about to drop the column `url` on the `webhookRequests` table. All the data in the column will be lost.
  - You are about to drop the column `method` on the `webhookRequests` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_webhookRequests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "headers" TEXT,
    "data" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextRunDate" DATETIME NOT NULL,
    "webhookId" INTEGER NOT NULL,

    FOREIGN KEY ("webhookId") REFERENCES "webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_webhookRequests" ("id", "headers", "data", "attempts", "nextRunDate", "webhookId") SELECT "id", "headers", "data", "attempts", "nextRunDate", "webhookId" FROM "webhookRequests";
DROP TABLE "webhookRequests";
ALTER TABLE "new_webhookRequests" RENAME TO "webhookRequests";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
