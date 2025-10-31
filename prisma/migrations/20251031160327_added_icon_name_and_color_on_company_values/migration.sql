/*
  Warnings:

  - You are about to drop the column `icon` on the `company_values` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."company_values" DROP COLUMN "icon",
ADD COLUMN     "iconColor" TEXT,
ADD COLUMN     "iconName" TEXT;
