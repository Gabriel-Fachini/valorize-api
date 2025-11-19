-- AlterTable
ALTER TABLE "public"."wallet_transactions" ADD COLUMN     "expired_at" TIMESTAMP(3),
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "is_expired" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."coin_expirations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "original_transaction_id" TEXT NOT NULL,
    "coins_expired" INTEGER NOT NULL,
    "expiration_date" TIMESTAMP(3) NOT NULL,
    "notified_90_days" BOOLEAN NOT NULL DEFAULT false,
    "notified_30_days" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_expirations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coin_expirations_user_id_idx" ON "public"."coin_expirations"("user_id");

-- CreateIndex
CREATE INDEX "coin_expirations_expiration_date_idx" ON "public"."coin_expirations"("expiration_date");

-- CreateIndex
CREATE INDEX "coin_expirations_original_transaction_id_idx" ON "public"."coin_expirations"("original_transaction_id");

-- CreateIndex
CREATE INDEX "coin_expirations_notified_90_days_notified_30_days_idx" ON "public"."coin_expirations"("notified_90_days", "notified_30_days");

-- CreateIndex
CREATE INDEX "wallet_transactions_transaction_type_balance_type_expires_a_idx" ON "public"."wallet_transactions"("transaction_type", "balance_type", "expires_at", "is_expired");

-- CreateIndex
CREATE INDEX "wallet_transactions_user_id_expires_at_idx" ON "public"."wallet_transactions"("user_id", "expires_at");

-- AddForeignKey
ALTER TABLE "public"."coin_expirations" ADD CONSTRAINT "coin_expirations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."coin_expirations" ADD CONSTRAINT "coin_expirations_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
