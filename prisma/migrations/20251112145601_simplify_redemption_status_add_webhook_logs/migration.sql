-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('SENT', 'FAILED', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- AlterTable Redemption - Remove default first, then cast type with UPPER(), then set new default
ALTER TABLE "redemptions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "redemptions" ALTER COLUMN "status" TYPE "RedemptionStatus" USING UPPER("status")::"RedemptionStatus";
ALTER TABLE "redemptions" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"RedemptionStatus";

-- AlterTable RedemptionTracking - Convert to enum with UPPER()
ALTER TABLE "redemption_tracking" ALTER COLUMN "status" TYPE "RedemptionStatus" USING UPPER("status")::"RedemptionStatus";

-- AlterTable VoucherRedemption - Map old values to new ones with UPPER(), then set default
ALTER TABLE "voucher_redemptions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "voucher_redemptions" ALTER COLUMN "status" TYPE "RedemptionStatus" USING
  CASE
    WHEN "status" = 'pending' THEN 'SENT'::"RedemptionStatus"
    WHEN "status" = 'processing' THEN 'SENT'::"RedemptionStatus"
    WHEN "status" = 'completed' THEN 'SENT'::"RedemptionStatus"
    WHEN "status" = 'failed' THEN 'FAILED'::"RedemptionStatus"
    ELSE 'SENT'::"RedemptionStatus"
  END;
ALTER TABLE "voucher_redemptions" ALTER COLUMN "status" SET DEFAULT 'SENT'::"RedemptionStatus";

-- CreateTable TremendousWebhookLog
CREATE TABLE "tremendous_webhook_logs" (
    "id" TEXT NOT NULL,
    "webhook_uuid" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT true,
    "redemption_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tremendous_webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tremendous_webhook_logs_webhook_uuid_key" ON "tremendous_webhook_logs"("webhook_uuid");

-- CreateIndex
CREATE INDEX "tremendous_webhook_logs_event_idx" ON "tremendous_webhook_logs"("event");

-- CreateIndex
CREATE INDEX "tremendous_webhook_logs_processed_created_at_idx" ON "tremendous_webhook_logs"("processed", "created_at");

-- AddForeignKey
ALTER TABLE "tremendous_webhook_logs" ADD CONSTRAINT "tremendous_webhook_logs_redemption_id_fkey" FOREIGN KEY ("redemption_id") REFERENCES "redemptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
