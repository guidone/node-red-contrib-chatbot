ALTER TABLE "contents" ADD COLUMN "order" INTEGER;
CREATE INDEX "content_order" ON "contents" ("order");