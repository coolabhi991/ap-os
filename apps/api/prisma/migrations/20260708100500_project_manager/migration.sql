-- Migration 6: Add manager column to Project table
ALTER TABLE "public"."Project" ADD COLUMN "manager" TEXT;
