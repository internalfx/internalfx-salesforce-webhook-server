-- DropIndex
DROP INDEX "sfObjects.type_timestamp_index";

-- CreateIndex
CREATE INDEX "sfObjects.type_timestamp_id_index" ON "sfObjects"("type", "timestamp", "id");
