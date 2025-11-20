/*
  Warnings:

  - You are about to drop the column `overdraft_limit` on the `company_wallets` table. All the data in the column will be lost.
  - You are about to drop the column `auth0_id` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[auth_user_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `auth_user_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."users_auth0_id_key";

-- AlterTable
ALTER TABLE "public"."company_wallets" DROP COLUMN "overdraft_limit";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "auth0_id",
ADD COLUMN     "auth_user_id" TEXT NOT NULL,
ADD COLUMN     "manager_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_user_id_key" ON "public"."users"("auth_user_id");

-- CreateIndex
CREATE INDEX "users_manager_id_idx" ON "public"."users"("manager_id");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
