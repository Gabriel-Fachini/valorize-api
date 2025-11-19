-- AlterTable
ALTER TABLE "public"."wallet_transactions" ADD COLUMN     "remaining_amount" INTEGER;

-- CreateIndex
CREATE INDEX "wallet_transactions_user_id_transaction_type_balance_type_i_idx" ON "public"."wallet_transactions"("user_id", "transaction_type", "balance_type", "is_expired", "remaining_amount", "created_at");
