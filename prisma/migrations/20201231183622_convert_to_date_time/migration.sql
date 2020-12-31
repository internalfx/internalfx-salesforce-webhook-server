/*
  Warnings:

  - You are about to alter the column `deleteDate` on the `sfObjectTypes` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sfObjectTypes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "syncDate" DATETIME NOT NULL,
    "deleteDate" DATETIME NOT NULL
);
INSERT INTO "new_sfObjectTypes" ("id", "name", "enabled", "syncDate", "deleteDate") SELECT "id", "name", "enabled", "syncDate", "deleteDate" FROM "sfObjectTypes";
DROP TABLE "sfObjectTypes";
ALTER TABLE "new_sfObjectTypes" RENAME TO "sfObjectTypes";
CREATE UNIQUE INDEX "sfObjectTypes.name_unique" ON "sfObjectTypes"("name");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
