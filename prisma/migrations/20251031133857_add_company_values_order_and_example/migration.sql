/*
  Warnings:

  - A unique constraint covering the columns `[company_id,title]` on the table `company_values` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `order` to the `company_values` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."company_values" ADD COLUMN     "example" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "icon" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "company_values_company_id_order_idx" ON "public"."company_values"("company_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "company_values_company_id_title_key" ON "public"."company_values"("company_id", "title");
