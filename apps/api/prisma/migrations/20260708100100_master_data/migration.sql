-- =============================================================
-- Migration 2: Master Data — Client, ProjectType, Project, Vendor
-- Company already exists from migrations: init + company_profile
-- No existing data is affected.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- New enum: ProjectStatus
-- ─────────────────────────────────────────────────────────────
CREATE TYPE "public"."ProjectStatus" AS ENUM (
    'PLANNING',
    'ACTIVE',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED'
);

-- ─────────────────────────────────────────────────────────────
-- Table: Client
-- Belongs to Company. Referenced by Project and Document.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "public"."Client" (
    "id"            TEXT NOT NULL,
    "companyId"     TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "contactPerson" TEXT,
    "email"         TEXT,
    "phone"         TEXT,
    "address"       TEXT,
    "gstNumber"     TEXT,
    "panNumber"     TEXT,
    "status"        TEXT NOT NULL DEFAULT 'Active',
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────────────────────
-- Table: ProjectType
-- Belongs to Company. Referenced by Project.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "public"."ProjectType" (
    "id"          TEXT NOT NULL,
    "companyId"   TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectType_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────────────────────
-- Table: Project
-- Central entity. Belongs to Company, optionally linked to
-- Client and ProjectType. All operational data hangs off Project.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "public"."Project" (
    "id"            TEXT NOT NULL,
    "companyId"     TEXT NOT NULL,
    "clientId"      TEXT,
    "projectTypeId" TEXT,
    "name"          TEXT NOT NULL,
    "code"          TEXT,
    "description"   TEXT,
    "location"      TEXT,
    "status"        "public"."ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "contractValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "progress"      INTEGER NOT NULL DEFAULT 0,
    "startDate"     TIMESTAMP(3),
    "endDate"       TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────────────────────
-- Table: Vendor
-- Belongs to Company. Referenced by procurement and finance tables.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "public"."Vendor" (
    "id"            TEXT NOT NULL,
    "companyId"     TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "contactPerson" TEXT,
    "email"         TEXT,
    "phone"         TEXT,
    "address"       TEXT,
    "gstNumber"     TEXT,
    "panNumber"     TEXT,
    "category"      TEXT,
    "status"        TEXT NOT NULL DEFAULT 'Active',
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────────────────────
-- Foreign key constraints
-- ─────────────────────────────────────────────────────────────

-- Client → Company
ALTER TABLE "public"."Client"
    ADD CONSTRAINT "Client_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ProjectType → Company
ALTER TABLE "public"."ProjectType"
    ADD CONSTRAINT "ProjectType_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Project → Company
ALTER TABLE "public"."Project"
    ADD CONSTRAINT "Project_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Project → Client (optional)
ALTER TABLE "public"."Project"
    ADD CONSTRAINT "Project_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Project → ProjectType (optional)
ALTER TABLE "public"."Project"
    ADD CONSTRAINT "Project_projectTypeId_fkey"
    FOREIGN KEY ("projectTypeId") REFERENCES "public"."ProjectType"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Vendor → Company
ALTER TABLE "public"."Vendor"
    ADD CONSTRAINT "Vendor_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
