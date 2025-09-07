-- CreateTable
CREATE TABLE "public"."companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'BR',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."companies_brazil" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "inscricao_estadual" TEXT,
    "inscricao_municipal" TEXT,
    "nire" TEXT,
    "cnae_principal" TEXT NOT NULL,
    "cnae_secundario" TEXT,
    "natureza_juridica" TEXT NOT NULL,
    "porte_empresa" TEXT NOT NULL,
    "situacao_cadastral" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_brazil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_contacts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_domain_key" ON "public"."companies"("domain");

-- CreateIndex
CREATE INDEX "companies_domain_idx" ON "public"."companies"("domain");

-- CreateIndex
CREATE INDEX "companies_country_idx" ON "public"."companies"("country");

-- CreateIndex
CREATE INDEX "companies_is_active_idx" ON "public"."companies"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "companies_brazil_company_id_key" ON "public"."companies_brazil"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_brazil_cnpj_key" ON "public"."companies_brazil"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "companies_brazil_nire_key" ON "public"."companies_brazil"("nire");

-- CreateIndex
CREATE INDEX "companies_brazil_cnpj_idx" ON "public"."companies_brazil"("cnpj");

-- CreateIndex
CREATE INDEX "companies_brazil_situacao_cadastral_idx" ON "public"."companies_brazil"("situacao_cadastral");

-- CreateIndex
CREATE INDEX "company_contacts_company_id_idx" ON "public"."company_contacts"("company_id");

-- CreateIndex
CREATE INDEX "company_contacts_user_id_idx" ON "public"."company_contacts"("user_id");

-- CreateIndex
CREATE INDEX "company_contacts_is_primary_idx" ON "public"."company_contacts"("is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "company_contacts_company_id_user_id_key" ON "public"."company_contacts"("company_id", "user_id");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."roles" ADD CONSTRAINT "roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."companies_brazil" ADD CONSTRAINT "companies_brazil_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_contacts" ADD CONSTRAINT "company_contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_contacts" ADD CONSTRAINT "company_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
