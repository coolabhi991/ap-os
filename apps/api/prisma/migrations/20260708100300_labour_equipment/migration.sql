-- =============================================================
-- Migration 4: Labour & Equipment
-- Depends on: Company, Project (Migration 2)
-- No existing data is affected.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- New enums
-- ─────────────────────────────────────────────────────────────

-- Worker skill classification
CREATE TYPE "public"."LabourCategory" AS ENUM (
    'SKILLED',
    'SEMI_SKILLED',
    'UNSKILLED'
);

-- Daily attendance state per worker record
CREATE TYPE "public"."AttendanceStatus" AS ENUM (
    'PRESENT',
    'ABSENT',
    'HALF_DAY',
    'ON_LEAVE'
);

-- Equipment operational state
CREATE TYPE "public"."EquipmentStatus" AS ENUM (
    'RUNNING',
    'IDLE',
    'BREAKDOWN',
    'MAINTENANCE',
    'DECOMMISSIONED'
);

-- ─────────────────────────────────────────────────────────────
-- Table: Labour
-- Tracks workers per project with contractor, category,
-- wages, overtime, and daily attendance status.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "public"."Labour" (
    "id"               TEXT NOT NULL,
    "companyId"        TEXT NOT NULL,
    "projectId"        TEXT,
    "name"             TEXT NOT NULL,
    "contractorName"   TEXT,
    "designation"      TEXT,
    "category"         "public"."LabourCategory"  NOT NULL DEFAULT 'UNSKILLED',
    "shift"            TEXT,
    "dailyWage"        DECIMAL(12,2),
    "overtimeRate"     DECIMAL(12,2),
    "attendanceStatus" "public"."AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "status"           TEXT NOT NULL DEFAULT 'Active',
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Labour_pkey" PRIMARY KEY ("id")
);

-- Indexes for common query patterns
CREATE INDEX "Labour_companyId_idx"        ON "public"."Labour"("companyId");
CREATE INDEX "Labour_projectId_idx"        ON "public"."Labour"("projectId");
CREATE INDEX "Labour_category_idx"         ON "public"."Labour"("category");
CREATE INDEX "Labour_attendanceStatus_idx" ON "public"."Labour"("attendanceStatus");

-- ─────────────────────────────────────────────────────────────
-- Table: Equipment
-- Tracks assets per project with registration, operator,
-- fuel, running hours, maintenance schedule, breakdown log,
-- and operational status.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "public"."Equipment" (
    "id"                  TEXT NOT NULL,
    "companyId"           TEXT NOT NULL,
    "projectId"           TEXT,
    "assetNumber"         TEXT,
    "assetName"           TEXT NOT NULL,
    "equipmentType"       TEXT NOT NULL,
    "registrationNumber"  TEXT,
    "operatorName"        TEXT,
    "fuelConsumption"     DECIMAL(12,2),
    "runningHours"        DECIMAL(10,2),
    "maintenanceSchedule" TEXT,
    "maintenanceDue"      TIMESTAMP(3),
    "breakdownNotes"      TEXT,
    "currentSite"         TEXT,
    "status"              "public"."EquipmentStatus" NOT NULL DEFAULT 'RUNNING',
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- Indexes for common query patterns
CREATE INDEX "Equipment_companyId_idx" ON "public"."Equipment"("companyId");
CREATE INDEX "Equipment_projectId_idx" ON "public"."Equipment"("projectId");
CREATE INDEX "Equipment_status_idx"    ON "public"."Equipment"("status");

-- ─────────────────────────────────────────────────────────────
-- Foreign key constraints
-- ─────────────────────────────────────────────────────────────

-- Labour → Company
ALTER TABLE "public"."Labour"
    ADD CONSTRAINT "Labour_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Labour → Project (optional)
ALTER TABLE "public"."Labour"
    ADD CONSTRAINT "Labour_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Equipment → Company
ALTER TABLE "public"."Equipment"
    ADD CONSTRAINT "Equipment_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Equipment → Project (optional)
ALTER TABLE "public"."Equipment"
    ADD CONSTRAINT "Equipment_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
