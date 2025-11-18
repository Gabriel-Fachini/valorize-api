-- CreateEnum
CREATE TYPE "public"."ChargeStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELED', 'PARTIAL');

-- CreateTable
CREATE TABLE "public"."charges" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."ChargeStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" TEXT,
    "paid_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."charge_attachments" (
    "id" TEXT NOT NULL,
    "charge_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_type" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charge_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."charge_payments" (
    "id" TEXT NOT NULL,
    "charge_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "notes" TEXT,
    "registered_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charge_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "charges_company_id_idx" ON "public"."charges"("company_id");

-- CreateIndex
CREATE INDEX "charges_status_idx" ON "public"."charges"("status");

-- CreateIndex
CREATE INDEX "charges_due_date_idx" ON "public"."charges"("due_date");

-- CreateIndex
CREATE INDEX "charges_company_id_status_idx" ON "public"."charges"("company_id", "status");

-- CreateIndex
CREATE INDEX "charge_attachments_charge_id_idx" ON "public"."charge_attachments"("charge_id");

-- CreateIndex
CREATE INDEX "charge_payments_charge_id_idx" ON "public"."charge_payments"("charge_id");

-- AddForeignKey
ALTER TABLE "public"."charges" ADD CONSTRAINT "charges_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."charges" ADD CONSTRAINT "charges_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."charge_attachments" ADD CONSTRAINT "charge_attachments_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "public"."charges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."charge_attachments" ADD CONSTRAINT "charge_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."charge_payments" ADD CONSTRAINT "charge_payments_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "public"."charges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."charge_payments" ADD CONSTRAINT "charge_payments_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
