/*
  Warnings:

  - Made the column `timestamp` on table `sfObjects` required. The migration will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sfObjects" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "data" TEXT NOT NULL,
    "changes" TEXT,
    PRIMARY KEY ("id")
);
INSERT INTO "new_sfObjects" ("id", "type", "data", "timestamp", "changes") SELECT "id", "type", "data", "timestamp", "changes" FROM "sfObjects";
DROP TABLE "sfObjects";
ALTER TABLE "new_sfObjects" RENAME TO "sfObjects";
CREATE INDEX "sfObjects.type_timestamp_index" ON "sfObjects"("type", "timestamp");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
