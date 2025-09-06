/*
  Warnings:

  - The primary key for the `role_permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `role_permissions` table. All the data in the column will be lost.
  - The primary key for the `user_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `user_roles` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."role_permissions_role_id_permission_id_key";

-- DropIndex
DROP INDEX "public"."user_roles_user_id_role_id_key";

-- AlterTable
ALTER TABLE "public"."role_permissions" DROP CONSTRAINT "role_permissions_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");

-- AlterTable
ALTER TABLE "public"."user_roles" DROP CONSTRAINT "user_roles_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "public"."role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "public"."role_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "roles_company_id_idx" ON "public"."roles"("company_id");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "public"."user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "public"."user_roles"("role_id");

-- CreateIndex
CREATE INDEX "user_roles_user_id_role_id_idx" ON "public"."user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "public"."users"("company_id");
