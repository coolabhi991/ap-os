-- =============================================================
-- Migration 3: Procurement & Inventory
-- Tables: PurchaseRequisition, PurchaseOrder, Inventory,
--         MaterialReceipt, MaterialIssue
-- Depends on: Company, Project, Vendor (Migration 2)
-- No existing data is affected.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- New enums
-- ─────────────────────────────────────────────────────────────

CREATE TYPE "public"."ProcurementStatus" AS ENUM (
    'DRAFT',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'ORDERED',
    'PARTIALLY_RECEIVED',
    'RECEIVED',
    'CLOSED'
);

CREATE TYPE "public"."ReceiptStatus" AS ENUM (
    'PENDING',
    'IN_TRANSIT',
    'RECEIVED',
    'PARTIALLY_RECEIVED',
    'REJECTED'
);

CREATE TYPE "public"."InventoryStatus" AS ENUM (
    'HEALTHY',
    'LOW',
    'CRITICAL',
    'OUT_OF_STOCK'
);

-- ─────────────────────────────────────────────────────────────
-- Table: PurchaseRequisition
-- Belongs to Company. Optionally linked to Project and Vendor.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "public"."PurchaseRequisition" (
    "id"                TEXT NOT NULL,
    "companyId"         TEXT NOT NULL,
    "projectId"         TEXT,
    "vendorId"          TEXT,
    "requisitionNumber" TEXT NOT NULL,
    "title"             TEXT NOT NULL,
    "description"       TEXT,
    "requiredDate"      TIMESTAMP(3),
    "status"            "public"."ProcurementStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmount"       DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes"             TEXT,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseRequisition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PurchaseRequisition_requisitionNumber_key"
    ON "public"."PurchaseRequisition"("requisitionNumber");

-- ─────────────────────────────────────────────────────────────
-- Table: PurchaseOrder
-- Belongs to Company. Links back to PurchaseRequisition, Vendor,
-- and Project.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "public"."PurchaseOrder" (
    "id"            TEXT NOT NULL,
    "companyId"     TEXT NOT NULL,
    "projectId"     TEXT,
    "vendorId"      TEXT,
    "requisitionId" TEXT,
    "poNumber"      TEXT NOT NULL,
    "orderDate"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate"  TIMESTAMP(3),
    "amount"        DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status"        "public"."ProcurementStatus" NOT NULL DEFAULT 'DRAFT',
    "notes"         TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key"
    ON "public"."PurchaseOrder"("poNumber");

-- ─────────────────────────────────────────────────────────────
-- Table: Inventory
-- Created before MaterialReceipt because MaterialReceipt
-- holds an optional FK to Inventory.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "public"."Inventory" (
    "id"               TEXT NOT NULL,
    "companyId"        TEXT NOT NULL,
    "projectId"        TEXT,
    "itemName"         TEXT NOT NULL,
    "category"         TEXT,
    "unit"             TEXT,
    "openingBalance"   DECIMAL(12,2) NOT NULL DEFAULT 0,
    "receiptsQuantity" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "issuesQuantity"   DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currentStock"     DECIMAL(12,2) NOT NULL DEFAULT 0,
    "location"         TEXT,
    "status"           "public"."InventoryStatus" NOT NULL DEFAULT 'HEALTHY',
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────────────────────
-- Table: MaterialReceipt
-- Links PurchaseOrder → Inventory.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "public"."MaterialReceipt" (
    "id"             TEXT NOT NULL,
    "companyId"      TEXT NOT NULL,
    "projectId"      TEXT,
    "purchaseOrderId" TEXT,
    "inventoryId"    TEXT,
    "receiptNumber"  TEXT NOT NULL,
    "receivedDate"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemName"       TEXT NOT NULL,
    "quantity"       DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unit"           TEXT,
    "status"         "public"."ReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "notes"          TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MaterialReceipt_receiptNumber_key"
    ON "public"."MaterialReceipt"("receiptNumber");

-- ─────────────────────────────────────────────────────────────
-- Table: MaterialIssue
-- Issues stock out of Inventory to a project.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "public"."MaterialIssue" (
    "id"          TEXT NOT NULL,
    "companyId"   TEXT NOT NULL,
    "projectId"   TEXT,
    "inventoryId" TEXT,
    "issueNumber" TEXT NOT NULL,
    "issuedDate"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemName"    TEXT NOT NULL,
    "quantity"    DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unit"        TEXT,
    "issuedTo"    TEXT,
    "issuedBy"    TEXT,
    "status"      "public"."ProcurementStatus" NOT NULL DEFAULT 'APPROVED',
    "notes"       TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialIssue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MaterialIssue_issueNumber_key"
    ON "public"."MaterialIssue"("issueNumber");

-- ─────────────────────────────────────────────────────────────
-- Foreign key constraints
-- ─────────────────────────────────────────────────────────────

-- PurchaseRequisition → Company
ALTER TABLE "public"."PurchaseRequisition"
    ADD CONSTRAINT "PurchaseRequisition_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- PurchaseRequisition → Project (optional)
ALTER TABLE "public"."PurchaseRequisition"
    ADD CONSTRAINT "PurchaseRequisition_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- PurchaseRequisition → Vendor (optional)
ALTER TABLE "public"."PurchaseRequisition"
    ADD CONSTRAINT "PurchaseRequisition_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- PurchaseOrder → Company
ALTER TABLE "public"."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- PurchaseOrder → Project (optional)
ALTER TABLE "public"."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- PurchaseOrder → Vendor (optional)
ALTER TABLE "public"."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- PurchaseOrder → PurchaseRequisition (optional)
ALTER TABLE "public"."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_requisitionId_fkey"
    FOREIGN KEY ("requisitionId") REFERENCES "public"."PurchaseRequisition"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Inventory → Company
ALTER TABLE "public"."Inventory"
    ADD CONSTRAINT "Inventory_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Inventory → Project (optional)
ALTER TABLE "public"."Inventory"
    ADD CONSTRAINT "Inventory_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- MaterialReceipt → Company
ALTER TABLE "public"."MaterialReceipt"
    ADD CONSTRAINT "MaterialReceipt_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- MaterialReceipt → Project (optional)
ALTER TABLE "public"."MaterialReceipt"
    ADD CONSTRAINT "MaterialReceipt_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- MaterialReceipt → PurchaseOrder (optional)
ALTER TABLE "public"."MaterialReceipt"
    ADD CONSTRAINT "MaterialReceipt_purchaseOrderId_fkey"
    FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."PurchaseOrder"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- MaterialReceipt → Inventory (optional)
ALTER TABLE "public"."MaterialReceipt"
    ADD CONSTRAINT "MaterialReceipt_inventoryId_fkey"
    FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- MaterialIssue → Company
ALTER TABLE "public"."MaterialIssue"
    ADD CONSTRAINT "MaterialIssue_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- MaterialIssue → Project (optional)
ALTER TABLE "public"."MaterialIssue"
    ADD CONSTRAINT "MaterialIssue_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- MaterialIssue → Inventory (optional)
ALTER TABLE "public"."MaterialIssue"
    ADD CONSTRAINT "MaterialIssue_inventoryId_fkey"
    FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
