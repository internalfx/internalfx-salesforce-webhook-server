-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sfObjectTypes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "syncDate" DATETIME NOT NULL,
    "deleteDate" TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'
);
INSERT INTO "new_sfObjectTypes" ("id", "name", "enabled", "syncDate") SELECT "id", "name", "enabled", "syncDate" FROM "sfObjectTypes";
DROP TABLE "sfObjectTypes";
ALTER TABLE "new_sfObjectTypes" RENAME TO "sfObjectTypes";
CREATE UNIQUE INDEX "sfObjectTypes.name_unique" ON "sfObjectTypes"("name");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
