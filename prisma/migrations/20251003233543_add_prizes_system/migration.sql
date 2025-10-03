-- CreateTable
CREATE TABLE "public"."prizes" (
    "id" TEXT NOT NULL,
    "company_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "images" TEXT[],
    "coin_price" INTEGER NOT NULL,
    "brand" TEXT,
    "specifications" JSONB,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prize_variants" (
    "id" TEXT NOT NULL,
    "prize_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "prize_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."redemptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prize_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "company_id" TEXT NOT NULL,
    "coins_spent" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "delivery_info" JSONB NOT NULL,
    "tracking_code" TEXT,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."redemption_tracking" (
    "id" TEXT NOT NULL,
    "redemption_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redemption_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prizes_company_id_is_active_stock_idx" ON "public"."prizes"("company_id", "is_active", "stock");

-- CreateIndex
CREATE INDEX "prizes_category_idx" ON "public"."prizes"("category");

-- CreateIndex
CREATE INDEX "prize_variants_prize_id_idx" ON "public"."prize_variants"("prize_id");

-- CreateIndex
CREATE INDEX "redemptions_user_id_redeemed_at_idx" ON "public"."redemptions"("user_id", "redeemed_at");

-- CreateIndex
CREATE INDEX "redemptions_company_id_status_idx" ON "public"."redemptions"("company_id", "status");

-- CreateIndex
CREATE INDEX "redemptions_prize_id_idx" ON "public"."redemptions"("prize_id");

-- CreateIndex
CREATE INDEX "redemption_tracking_redemption_id_created_at_idx" ON "public"."redemption_tracking"("redemption_id", "created_at");

-- AddForeignKey
ALTER TABLE "public"."prizes" ADD CONSTRAINT "prizes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prize_variants" ADD CONSTRAINT "prize_variants_prize_id_fkey" FOREIGN KEY ("prize_id") REFERENCES "public"."prizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."redemptions" ADD CONSTRAINT "redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."redemptions" ADD CONSTRAINT "redemptions_prize_id_fkey" FOREIGN KEY ("prize_id") REFERENCES "public"."prizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."redemptions" ADD CONSTRAINT "redemptions_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."prize_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."redemptions" ADD CONSTRAINT "redemptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."redemption_tracking" ADD CONSTRAINT "redemption_tracking_redemption_id_fkey" FOREIGN KEY ("redemption_id") REFERENCES "public"."redemptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
