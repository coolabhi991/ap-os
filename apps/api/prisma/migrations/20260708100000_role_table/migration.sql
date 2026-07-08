-- =============================================================
-- Migration 1: Safe User → Role migration
-- Strategy:
--   1. Create the Role table
--   2. Add roleId as NULLABLE to User (keeps the existing role column intact)
--   3. Backfill: insert one Role row per unique (role, companyId) pair
--   4. Update every User row to point to its Role
--   5. Make roleId NOT NULL (safe: all rows now have a value)
--   6. Drop the old role column
--   7. Add FK constraints
-- =============================================================

-- Step 1: Create the Role table
CREATE TABLE "public"."Role" (
    "id"        TEXT NOT NULL,
    "name"      "public"."UserRole" NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- One role name is unique per company (not globally)
CREATE UNIQUE INDEX "Role_name_companyId_key" ON "public"."Role"("name", "companyId");

-- Step 2: Add roleId as nullable — existing rows are untouched
ALTER TABLE "public"."User" ADD COLUMN "roleId" TEXT;

-- Step 3: Backfill — insert one Role row per unique (role, companyId) found in User
INSERT INTO "public"."Role" ("id", "name", "companyId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    u."role",
    u."companyId",
    NOW(),
    NOW()
FROM (
    SELECT DISTINCT "role", "companyId" FROM "public"."User"
) u;

-- Step 4: Point each User row to its matching Role row
UPDATE "public"."User" u
SET "roleId" = r."id"
FROM "public"."Role" r
WHERE r."name"      = u."role"
  AND r."companyId" = u."companyId";

-- Step 5: Now that every user has a roleId value, enforce NOT NULL
ALTER TABLE "public"."User" ALTER COLUMN "roleId" SET NOT NULL;

-- Step 6: Drop the old role column — data is fully preserved in the Role table
ALTER TABLE "public"."User" DROP COLUMN "role";

-- Step 7: Foreign key constraints
ALTER TABLE "public"."Role" ADD CONSTRAINT "Role_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."User" ADD CONSTRAINT "User_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
