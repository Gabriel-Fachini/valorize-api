-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "department_id" TEXT,
ADD COLUMN     "job_title_id" TEXT;

-- CreateTable
CREATE TABLE "public"."departments" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_titles" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_titles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "departments_company_id_idx" ON "public"."departments"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_company_id_name_key" ON "public"."departments"("company_id", "name");

-- CreateIndex
CREATE INDEX "job_titles_company_id_idx" ON "public"."job_titles"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_titles_company_id_name_key" ON "public"."job_titles"("company_id", "name");

-- CreateIndex
CREATE INDEX "users_job_title_id_idx" ON "public"."users"("job_title_id");

-- CreateIndex
CREATE INDEX "users_department_id_idx" ON "public"."users"("department_id");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_job_title_id_fkey" FOREIGN KEY ("job_title_id") REFERENCES "public"."job_titles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."departments" ADD CONSTRAINT "departments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_titles" ADD CONSTRAINT "job_titles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
