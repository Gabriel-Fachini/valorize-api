-- CreateEnum
CREATE TYPE "public"."PlanType" AS ENUM ('ESSENTIAL', 'PROFESSIONAL');

-- AlterTable
ALTER TABLE "public"."companies" ADD COLUMN     "billing_email" TEXT;

-- AlterTable
ALTER TABLE "public"."company_wallets" ADD COLUMN     "is_frozen" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."company_plans" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "plan_type" "public"."PlanType" NOT NULL,
    "price_per_user" DECIMAL(10,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "changes" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_contact_history" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_contact_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_plans_company_id_key" ON "public"."company_plans"("company_id");

-- CreateIndex
CREATE INDEX "company_plans_company_id_idx" ON "public"."company_plans"("company_id");

-- CreateIndex
CREATE INDEX "company_plans_plan_type_idx" ON "public"."company_plans"("plan_type");

-- CreateIndex
CREATE INDEX "company_plans_is_active_idx" ON "public"."company_plans"("is_active");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "public"."audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "public"."audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "public"."audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "company_contact_history_contact_id_idx" ON "public"."company_contact_history"("contact_id");

-- CreateIndex
CREATE INDEX "company_contact_history_changed_by_idx" ON "public"."company_contact_history"("changed_by");

-- CreateIndex
CREATE INDEX "company_contact_history_changed_at_idx" ON "public"."company_contact_history"("changed_at");

-- CreateIndex
CREATE INDEX "company_wallets_is_frozen_idx" ON "public"."company_wallets"("is_frozen");

-- AddForeignKey
ALTER TABLE "public"."company_plans" ADD CONSTRAINT "company_plans_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_contact_history" ADD CONSTRAINT "company_contact_history_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."company_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
