-- =============================================================
-- Migration 5: Billing Engine — MeasurementBook + RunningBill
-- Depends on: Company, Project (Migration 2)
-- Workflow: Project → MeasurementBook → RunningBill → Finance
-- No existing data is affected.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- Prerequisite enums not yet in the database
-- (defined in the original schema but not applied by prior migrations)
-- ─────────────────────────────────────────────────────────────
CREATE TYPE "public"."BillStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'APPROVED',
    'PAID',
    'CANCELLED'
);

CREATE TYPE "public"."MeasurementStatus" AS ENUM (
    'DRAFT',
    'VERIFIED',
    'APPROVED',
    'REVISED'
);

-- ─────────────────────────────────────────────────────────────
-- New enum: BillType
-- BillStatus and MeasurementStatus already exist from schema.
-- ─────────────────────────────────────────────────────────────
CREATE TYPE "public"."BillType" AS ENUM (
    'RA_BILL',
    'FINAL_BILL',
    'ADVANCE_BILL'
);

-- ─────────────────────────────────────────────────────────────
-- Table: MeasurementBook
-- Line-item measurement records against a BOQ.
-- Must be created before RunningBill (RunningBill FKs to it).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "public"."MeasurementBook" (
    "id"               TEXT NOT NULL,
    "companyId"        TEXT NOT NULL,
    "projectId"        TEXT,

    -- MB identity
    "mbNumber"         TEXT NOT NULL,
    "mbDate"           TIMESTAMP(3),
    "pageNumber"       TEXT,

    -- BOQ line-item
    "boqItem"          TEXT,
    "itemDescription"  TEXT,
    "unit"             TEXT,

    -- Quantities  (4 decimal places for civil measurements)
    "previousQuantity" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "currentQuantity"  DECIMAL(12,4) NOT NULL DEFAULT 0,
    "totalQuantity"    DECIMAL(12,4) NOT NULL DEFAULT 0,

    -- Rates
    "boqRate"          DECIMAL(14,2) NOT NULL DEFAULT 0,
    "extraItemRate"    DECIMAL(14,2) NOT NULL DEFAULT 0,

    -- Amounts  (14 digits to handle large civil contract values)
    "previousAmount"   DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currentAmount"    DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalAmount"      DECIMAL(14,2) NOT NULL DEFAULT 0,

    -- Approval chain
    "measuredBy"       TEXT,
    "checkedBy"        TEXT,
    "verifiedBy"       TEXT,
    "approvedBy"       TEXT,

    "status"           "public"."MeasurementStatus" NOT NULL DEFAULT 'DRAFT',
    "remarks"          TEXT,

    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeasurementBook_pkey" PRIMARY KEY ("id")
);

-- Unique MB number per installation
CREATE UNIQUE INDEX "MeasurementBook_mbNumber_key"
    ON "public"."MeasurementBook"("mbNumber");

-- Query-pattern indexes
CREATE INDEX "MeasurementBook_companyId_idx" ON "public"."MeasurementBook"("companyId");
CREATE INDEX "MeasurementBook_projectId_idx" ON "public"."MeasurementBook"("projectId");
CREATE INDEX "MeasurementBook_status_idx"    ON "public"."MeasurementBook"("status");

-- ─────────────────────────────────────────────────────────────
-- Table: RunningBill
-- Contractor billing against certified measurement quantities.
-- References MeasurementBook to link bill ↔ measurements.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "public"."RunningBill" (
    "id"                      TEXT NOT NULL,
    "companyId"               TEXT NOT NULL,
    "projectId"               TEXT,
    "measurementBookId"       TEXT,

    -- Bill classification
    "billType"                "public"."BillType" NOT NULL DEFAULT 'RA_BILL',
    "billNumber"              TEXT NOT NULL,
    "billPeriodFrom"          TIMESTAMP(3),
    "billPeriodTo"            TIMESTAMP(3),

    -- Certified amounts
    "grossAmount"             DECIMAL(14,2) NOT NULL DEFAULT 0,
    "previousCertifiedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currentCertifiedAmount"  DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalCertifiedAmount"    DECIMAL(14,2) NOT NULL DEFAULT 0,

    -- Recoveries (deducted from gross)
    "securityDeposit"         DECIMAL(14,2) NOT NULL DEFAULT 0,
    "royaltyRecovery"         DECIMAL(14,2) NOT NULL DEFAULT 0,
    "mobilizationRecovery"    DECIMAL(14,2) NOT NULL DEFAULT 0,
    "otherRecovery"           DECIMAL(14,2) NOT NULL DEFAULT 0,

    -- Tax and net
    "gstAmount"               DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netPayable"              DECIMAL(14,2) NOT NULL DEFAULT 0,

    -- Payment tracking
    "amountReceived"          DECIMAL(14,2) NOT NULL DEFAULT 0,
    "outstandingAmount"       DECIMAL(14,2) NOT NULL DEFAULT 0,

    -- Dates
    "submissionDate"          TIMESTAMP(3),
    "approvalDate"            TIMESTAMP(3),
    "paymentDate"             TIMESTAMP(3),

    -- Approval chain
    "submittedBy"             TEXT,
    "checkedBy"               TEXT,
    "approvedBy"              TEXT,

    "status"                  "public"."BillStatus" NOT NULL DEFAULT 'DRAFT',
    "remarks"                 TEXT,

    "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RunningBill_pkey" PRIMARY KEY ("id")
);

-- Unique bill number per installation
CREATE UNIQUE INDEX "RunningBill_billNumber_key"
    ON "public"."RunningBill"("billNumber");

-- Query-pattern indexes
CREATE INDEX "RunningBill_companyId_idx"         ON "public"."RunningBill"("companyId");
CREATE INDEX "RunningBill_projectId_idx"          ON "public"."RunningBill"("projectId");
CREATE INDEX "RunningBill_measurementBookId_idx"  ON "public"."RunningBill"("measurementBookId");
CREATE INDEX "RunningBill_status_idx"             ON "public"."RunningBill"("status");
CREATE INDEX "RunningBill_billType_idx"           ON "public"."RunningBill"("billType");

-- ─────────────────────────────────────────────────────────────
-- Foreign key constraints
-- ─────────────────────────────────────────────────────────────

-- MeasurementBook → Company
ALTER TABLE "public"."MeasurementBook"
    ADD CONSTRAINT "MeasurementBook_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- MeasurementBook → Project (optional)
ALTER TABLE "public"."MeasurementBook"
    ADD CONSTRAINT "MeasurementBook_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- RunningBill → Company
ALTER TABLE "public"."RunningBill"
    ADD CONSTRAINT "RunningBill_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- RunningBill → Project (optional)
ALTER TABLE "public"."RunningBill"
    ADD CONSTRAINT "RunningBill_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- RunningBill → MeasurementBook (optional — bill can exist before MB is linked)
ALTER TABLE "public"."RunningBill"
    ADD CONSTRAINT "RunningBill_measurementBookId_fkey"
    FOREIGN KEY ("measurementBookId") REFERENCES "public"."MeasurementBook"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
