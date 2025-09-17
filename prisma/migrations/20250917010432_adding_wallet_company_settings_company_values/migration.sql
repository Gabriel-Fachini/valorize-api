-- CreateTable
CREATE TABLE "public"."company_settings" (
    "id" SERIAL NOT NULL,
    "company_id" TEXT NOT NULL,
    "weekly_compliment_coin_limit" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_values" (
    "id" SERIAL NOT NULL,
    "company_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "compliment_balance" INTEGER NOT NULL DEFAULT 100,
    "redeemable_balance" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."compliments" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "value_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "coins" INTEGER NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wallet_transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "balance_type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "previous_balance" INTEGER NOT NULL,
    "new_balance" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_settings_company_id_key" ON "public"."company_settings"("company_id");

-- CreateIndex
CREATE INDEX "company_values_company_id_idx" ON "public"."company_values"("company_id");

-- CreateIndex
CREATE INDEX "company_values_is_active_idx" ON "public"."company_values"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "public"."wallets"("user_id");

-- CreateIndex
CREATE INDEX "wallets_compliment_balance_idx" ON "public"."wallets"("compliment_balance");

-- CreateIndex
CREATE INDEX "compliments_sender_id_idx" ON "public"."compliments"("sender_id");

-- CreateIndex
CREATE INDEX "compliments_receiver_id_idx" ON "public"."compliments"("receiver_id");

-- CreateIndex
CREATE INDEX "compliments_company_id_idx" ON "public"."compliments"("company_id");

-- CreateIndex
CREATE INDEX "compliments_value_id_idx" ON "public"."compliments"("value_id");

-- CreateIndex
CREATE INDEX "compliments_created_at_idx" ON "public"."compliments"("created_at");

-- CreateIndex
CREATE INDEX "compliments_company_id_created_at_idx" ON "public"."compliments"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "wallet_transactions_wallet_id_idx" ON "public"."wallet_transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_user_id_idx" ON "public"."wallet_transactions"("user_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_transaction_type_idx" ON "public"."wallet_transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "wallet_transactions_created_at_idx" ON "public"."wallet_transactions"("created_at");

-- CreateIndex
CREATE INDEX "wallet_transactions_user_id_created_at_idx" ON "public"."wallet_transactions"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "public"."company_settings" ADD CONSTRAINT "company_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_values" ADD CONSTRAINT "company_values_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compliments" ADD CONSTRAINT "compliments_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."compliments" ADD CONSTRAINT "compliments_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."compliments" ADD CONSTRAINT "compliments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."compliments" ADD CONSTRAINT "compliments_value_id_fkey" FOREIGN KEY ("value_id") REFERENCES "public"."company_values"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
