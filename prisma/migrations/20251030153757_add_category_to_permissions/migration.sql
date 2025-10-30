/*
  Warnings:

  - Added the required column `category` to the `permissions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add column with temporary default value
ALTER TABLE "public"."permissions" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Uncategorized';

-- Update existing permissions with their correct categories
UPDATE "public"."permissions" SET "category" = 'User Management' WHERE "name" LIKE 'users:%';
UPDATE "public"."permissions" SET "category" = 'Role Management' WHERE "name" LIKE 'roles:%';
UPDATE "public"."permissions" SET "category" = 'Administration' WHERE "name" IN ('admin:access_panel', 'admin:view_analytics', 'admin:manage_company', 'admin:manage_system');
UPDATE "public"."permissions" SET "category" = 'Company' WHERE "name" = 'company:manage_settings';
UPDATE "public"."permissions" SET "category" = 'Praise System' WHERE "name" LIKE 'praise:%';
UPDATE "public"."permissions" SET "category" = 'Coins System' WHERE "name" LIKE 'coins:%';
UPDATE "public"."permissions" SET "category" = 'Store System' WHERE "name" LIKE 'store:%';
UPDATE "public"."permissions" SET "category" = 'Library System' WHERE "name" LIKE 'library:%';

-- Remove the default value constraint (we want it to be required moving forward)
ALTER TABLE "public"."permissions" ALTER COLUMN "category" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "permissions_category_idx" ON "public"."permissions"("category");
