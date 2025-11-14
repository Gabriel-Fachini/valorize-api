-- Update prize type from 'physical' to 'product'
-- This migration updates all existing prizes with type 'physical' to 'product'
UPDATE "public"."prizes"
SET "type" = 'product'
WHERE "type" = 'physical';

-- CreateIndex
CREATE INDEX "tremendous_webhook_logs_webhook_uuid_idx" ON "public"."tremendous_webhook_logs"("webhook_uuid");
