-- CreateTable
CREATE TABLE "company_wallets" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_deposited" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_spent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "overdraft_limit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_deposits" (
    "id" TEXT NOT NULL,
    "company_wallet_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "payment_method" TEXT,
    "transaction_id" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "deposited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_wallets_company_id_key" ON "company_wallets"("company_id");

-- CreateIndex
CREATE INDEX "company_wallets_company_id_idx" ON "company_wallets"("company_id");

-- CreateIndex
CREATE INDEX "company_wallets_balance_idx" ON "company_wallets"("balance");

-- CreateIndex
CREATE INDEX "wallet_deposits_company_wallet_id_idx" ON "wallet_deposits"("company_wallet_id");

-- CreateIndex
CREATE INDEX "wallet_deposits_status_idx" ON "wallet_deposits"("status");

-- CreateIndex
CREATE INDEX "wallet_deposits_deposited_at_idx" ON "wallet_deposits"("deposited_at");

-- CreateIndex
CREATE INDEX "wallet_deposits_company_wallet_id_deposited_at_idx" ON "wallet_deposits"("company_wallet_id", "deposited_at");

-- AddForeignKey
ALTER TABLE "company_wallets" ADD CONSTRAINT "company_wallets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_deposits" ADD CONSTRAINT "wallet_deposits_company_wallet_id_fkey" FOREIGN KEY ("company_wallet_id") REFERENCES "company_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
