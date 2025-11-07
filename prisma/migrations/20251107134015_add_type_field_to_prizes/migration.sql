/*
  Warnings:

  - Added the required column `type` to the `prizes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."prizes" ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "category" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "prizes_type_idx" ON "public"."prizes"("type");
