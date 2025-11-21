/*
  Warnings:

  - You are about to drop the `user_onboarding` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."user_onboarding" DROP CONSTRAINT "user_onboarding_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "last_welcome_email_sent_at" TIMESTAMP(3),
ADD COLUMN     "welcome_email_send_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "welcome_email_sent_at" TIMESTAMP(3);

-- DropTable
DROP TABLE "public"."user_onboarding";

-- CreateIndex
CREATE INDEX "users_welcome_email_send_count_idx" ON "public"."users"("welcome_email_send_count");
