-- AlterTable: Add logo_url to companies
ALTER TABLE "companies" ADD COLUMN "logo_url" TEXT;

-- CreateTable: AllowedDomain for SSO domains
CREATE TABLE "allowed_domains" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allowed_domains_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "allowed_domains_company_id_idx" ON "allowed_domains"("company_id");

-- CreateIndex: Unique constraint on company_id + domain
CREATE UNIQUE INDEX "allowed_domains_company_id_domain_key" ON "allowed_domains"("company_id", "domain");

-- AddForeignKey
ALTER TABLE "allowed_domains" ADD CONSTRAINT "allowed_domains_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Add weekly_renewal_amount and renewal_day to company_settings
ALTER TABLE "company_settings" ADD COLUMN "weekly_renewal_amount" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "company_settings" ADD COLUMN "renewal_day" INTEGER NOT NULL DEFAULT 1;

-- Data Migration: Copy data from old column to new column
UPDATE "company_settings" SET "weekly_renewal_amount" = "weekly_compliment_coin_limit";

-- AlterTable: Drop old column
ALTER TABLE "company_settings" DROP COLUMN "weekly_compliment_coin_limit";
