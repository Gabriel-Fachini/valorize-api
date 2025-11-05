-- DropForeignKey
ALTER TABLE "public"."redemptions" DROP CONSTRAINT "redemptions_address_id_fkey";

-- AlterTable
ALTER TABLE "public"."prizes" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "product_dimensions" TEXT,
ADD COLUMN     "product_requires_address" BOOLEAN DEFAULT true,
ADD COLUMN     "product_weight" DECIMAL(5,2),
ADD COLUMN     "voucher_external_id" TEXT,
ADD COLUMN     "voucher_max_value" DECIMAL(10,2),
ADD COLUMN     "voucher_min_value" DECIMAL(10,2),
ADD COLUMN     "voucher_provider" TEXT;

-- AlterTable
ALTER TABLE "public"."redemptions" ALTER COLUMN "address_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."voucher_redemptions" (
    "id" TEXT NOT NULL,
    "redemption_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_order_id" TEXT,
    "provider_reward_id" TEXT,
    "voucher_link" TEXT,
    "voucher_code" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_retry_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voucher_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."voucher_products" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "images" TEXT[],
    "min_value" DECIMAL(10,2) NOT NULL,
    "max_value" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "countries" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voucher_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_redemptions" (
    "id" TEXT NOT NULL,
    "redemption_id" TEXT NOT NULL,
    "tracking_code" TEXT,
    "carrier" TEXT,
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "estimated_delivery" TIMESTAMP(3),
    "weight" DECIMAL(5,2),
    "dimensions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voucher_redemptions_redemption_id_key" ON "public"."voucher_redemptions"("redemption_id");

-- CreateIndex
CREATE INDEX "voucher_redemptions_status_retry_count_idx" ON "public"."voucher_redemptions"("status", "retry_count");

-- CreateIndex
CREATE INDEX "voucher_redemptions_provider_provider_order_id_idx" ON "public"."voucher_redemptions"("provider", "provider_order_id");

-- CreateIndex
CREATE INDEX "voucher_redemptions_created_at_idx" ON "public"."voucher_redemptions"("created_at");

-- CreateIndex
CREATE INDEX "voucher_products_provider_is_active_currency_idx" ON "public"."voucher_products"("provider", "is_active", "currency");

-- CreateIndex
CREATE INDEX "voucher_products_category_idx" ON "public"."voucher_products"("category");

-- CreateIndex
CREATE INDEX "voucher_products_last_sync_at_idx" ON "public"."voucher_products"("last_sync_at");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_products_provider_external_id_key" ON "public"."voucher_products"("provider", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_redemptions_redemption_id_key" ON "public"."product_redemptions"("redemption_id");

-- CreateIndex
CREATE INDEX "product_redemptions_carrier_shipped_at_idx" ON "public"."product_redemptions"("carrier", "shipped_at");

-- CreateIndex
CREATE INDEX "product_redemptions_delivered_at_idx" ON "public"."product_redemptions"("delivered_at");

-- CreateIndex
CREATE INDEX "prizes_voucher_provider_is_active_idx" ON "public"."prizes"("voucher_provider", "is_active");

-- AddForeignKey
ALTER TABLE "public"."redemptions" ADD CONSTRAINT "redemptions_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_redemption_id_fkey" FOREIGN KEY ("redemption_id") REFERENCES "public"."redemptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_redemptions" ADD CONSTRAINT "product_redemptions_redemption_id_fkey" FOREIGN KEY ("redemption_id") REFERENCES "public"."redemptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
