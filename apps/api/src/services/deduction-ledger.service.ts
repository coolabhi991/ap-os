import prisma from "../config/prisma.js";
import { Prisma, DeductionType } from "@prisma/client";
import { DEDUCTION_TYPE_LABELS } from "./running-bill.service.js";

export interface DeductionLedgerQuery {
  projectId?: string;
  siteId?: string;
  fromDate?: string;
  toDate?: string;
}

function dateRangeWhere(fromDate?: string, toDate?: string): Prisma.DateTimeFilter | undefined {
  if (!fromDate && !toDate) return undefined;
  return {
    ...(fromDate ? { gte: new Date(fromDate) } : {}),
    ...(toDate ? { lte: new Date(toDate) } : {}),
  };
}

type SiteBucket = {
  siteId: string;
  siteName: string;
  projectId: string;
  projectName: string;
  byType: Record<DeductionType, number>;
  sdReleased: number;
};

function emptyByType(): Record<DeductionType, number> {
  return {
    SECURITY_DEPOSIT: 0,
    GST: 0,
    GST_STATE: 0,
    GST_CENTRAL: 0,
    LABOUR_CESS: 0,
    ROYALTY: 0,
    TDS: 0,
    INCOME_TAX: 0,
    MOBILIZATION_RECOVERY: 0,
    INSURANCE: 0,
    FINE: 0,
    OTHER: 0,
  };
}

/**
 * Every deduction ever recorded, joined back to the Site/Project it belongs to (via
 * RunningBillDeduction -> RunningBill -> Site/Project) plus every SECURITY_DEPOSIT_RELEASE
 * allocation (tagged directly with siteId — see transaction-allocation.service.ts). Fetched once
 * and grouped in memory; every rollup below (site-wise, client-wise, SD pending) is derived from
 * this same pair of queries so the numbers can never disagree with each other.
 */
async function loadDeductionRows(companyId: string, query: DeductionLedgerQuery) {
  const billWhere: Prisma.RunningBillWhereInput = {
    companyId,
    // A Draft bill is still a work-in-progress calculation, not yet a certified/submitted
    // deduction — excluded here so every rollup (Recovery Ledger, SD Pending, Site Financial
    // Summary) always agrees with Gross Billing/Payments, which are scoped the same way.
    status: { not: "DRAFT" },
    ...(query.projectId && { projectId: query.projectId }),
    ...(query.siteId && { siteId: query.siteId }),
    ...(dateRangeWhere(query.fromDate, query.toDate) && { billDate: dateRangeWhere(query.fromDate, query.toDate) }),
  };

  const [deductions, sdReleases] = await Promise.all([
    prisma.runningBillDeduction.findMany({
      where: { companyId, runningBill: billWhere },
      include: {
        runningBill: {
          select: {
            id: true,
            billNumber: true,
            billDate: true,
            siteId: true,
            siteRecord: { select: { id: true, name: true } },
            projectId: true,
            project: { select: { id: true, name: true, clientId: true, client: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transactionAllocation.findMany({
      where: {
        companyId,
        allocationType: "SECURITY_DEPOSIT_RELEASE",
        ...(query.siteId && { siteId: query.siteId }),
        ...(dateRangeWhere(query.fromDate, query.toDate) && { bankTransaction: { transactionDate: dateRangeWhere(query.fromDate, query.toDate) } }),
      },
      include: {
        site: { select: { id: true, name: true, projectId: true, project: { select: { id: true, name: true } } } },
        bankTransaction: { select: { transactionDate: true, companyBankAccount: { select: { nickname: true, bankName: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { deductions, sdReleases };
}

export async function getSiteWiseDeductions(companyId: string, query: DeductionLedgerQuery) {
  const { deductions, sdReleases } = await loadDeductionRows(companyId, query);

  const bySite = new Map<string, SiteBucket>();
  const ensure = (siteId: string, siteName: string, projectId: string, projectName: string) => {
    if (!bySite.has(siteId)) bySite.set(siteId, { siteId, siteName, projectId, projectName, byType: emptyByType(), sdReleased: 0 });
    return bySite.get(siteId)!;
  };

  for (const d of deductions) {
    const rb = d.runningBill;
    const bucket = ensure(rb.siteId, rb.siteRecord?.name ?? "Unknown Site", rb.projectId, rb.project?.name ?? "Unknown Project");
    bucket.byType[d.type] += Number(d.amount);
  }
  for (const r of sdReleases) {
    if (!r.siteId || !r.site) continue;
    const bucket = ensure(r.siteId, r.site.name, r.site.projectId, r.site.project?.name ?? "Unknown Project");
    bucket.sdReleased += Number(r.amount);
  }

  const rows = Array.from(bySite.values()).map((b) => {
    const sdDeducted = b.byType.SECURITY_DEPOSIT;
    const sdPending = sdDeducted - b.sdReleased;
    const totalDeductions = Object.values(b.byType).reduce((s, v) => s + v, 0);
    return {
      siteId: b.siteId,
      siteName: b.siteName,
      projectId: b.projectId,
      projectName: b.projectName,
      sdDeducted: sdDeducted.toFixed(2),
      sdReleased: b.sdReleased.toFixed(2),
      sdPending: sdPending.toFixed(2),
      gstState: b.byType.GST_STATE.toFixed(2),
      gstCentral: b.byType.GST_CENTRAL.toFixed(2),
      gst: b.byType.GST.toFixed(2),
      incomeTax: b.byType.INCOME_TAX.toFixed(2),
      tds: b.byType.TDS.toFixed(2),
      labourCess: b.byType.LABOUR_CESS.toFixed(2),
      royalty: b.byType.ROYALTY.toFixed(2),
      insurance: b.byType.INSURANCE.toFixed(2),
      fine: b.byType.FINE.toFixed(2),
      mobilizationRecovery: b.byType.MOBILIZATION_RECOVERY.toFixed(2),
      other: b.byType.OTHER.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
    };
  });

  rows.sort((a, b) => a.siteName.localeCompare(b.siteName));
  return rows;
}

export async function getClientWiseDeductions(companyId: string, query: DeductionLedgerQuery) {
  const { deductions } = await loadDeductionRows(companyId, query);

  const byClient = new Map<string, { clientId: string; clientName: string; byType: Record<DeductionType, number> }>();
  const ensure = (clientId: string, clientName: string) => {
    if (!byClient.has(clientId)) byClient.set(clientId, { clientId, clientName, byType: emptyByType() });
    return byClient.get(clientId)!;
  };

  for (const d of deductions) {
    const client = d.runningBill.project?.client;
    const bucket = ensure(client?.id ?? "__none__", client?.name ?? "No Client Assigned");
    bucket.byType[d.type] += Number(d.amount);
  }

  const rows = Array.from(byClient.values()).map((b) => ({
    clientId: b.clientId === "__none__" ? "" : b.clientId,
    clientName: b.clientName,
    sdDeducted: b.byType.SECURITY_DEPOSIT.toFixed(2),
    gstState: b.byType.GST_STATE.toFixed(2),
    gstCentral: b.byType.GST_CENTRAL.toFixed(2),
    gst: b.byType.GST.toFixed(2),
    incomeTax: b.byType.INCOME_TAX.toFixed(2),
    tds: b.byType.TDS.toFixed(2),
    labourCess: b.byType.LABOUR_CESS.toFixed(2),
    royalty: b.byType.ROYALTY.toFixed(2),
    insurance: b.byType.INSURANCE.toFixed(2),
    fine: b.byType.FINE.toFixed(2),
    mobilizationRecovery: b.byType.MOBILIZATION_RECOVERY.toFixed(2),
    other: b.byType.OTHER.toFixed(2),
    totalDeductions: Object.values(b.byType)
      .reduce((s, v) => s + v, 0)
      .toFixed(2),
  }));

  rows.sort((a, b) => a.clientName.localeCompare(b.clientName));
  return rows;
}

/** SD Deducted / Released / Pending per site — Pending is always computed, never stored. */
export async function getSDPendingReport(companyId: string, query: DeductionLedgerQuery) {
  const siteRows = await getSiteWiseDeductions(companyId, query);
  return siteRows
    .map((r) => ({
      siteId: r.siteId,
      siteName: r.siteName,
      projectName: r.projectName,
      sdDeducted: r.sdDeducted,
      sdReleased: r.sdReleased,
      sdPending: r.sdPending,
    }))
    .filter((r) => Number(r.sdDeducted) > 0 || Number(r.sdReleased) > 0)
    .sort((a, b) => Number(b.sdPending) - Number(a.sdPending));
}

export interface RecoveryLedgerEntry {
  date: string;
  siteId: string;
  siteName: string;
  projectName: string;
  runningBillNumber: string;
  type: string;
  typeLabel: string;
  amount: string;
  direction: "DEDUCTED" | "RELEASED";
  remarks: string;
}

/** Flat chronological history combining every deduction line and every SD release, across all bills/sites. */
export async function getRecoveryLedger(companyId: string, query: DeductionLedgerQuery & { type?: string }) {
  const { deductions, sdReleases } = await loadDeductionRows(companyId, query);

  const entries: RecoveryLedgerEntry[] = [];

  for (const d of deductions) {
    if (query.type && d.type !== query.type) continue;
    entries.push({
      date: d.runningBill.billDate.toISOString().slice(0, 10),
      siteId: d.runningBill.siteId,
      siteName: d.runningBill.siteRecord?.name ?? "Unknown Site",
      projectName: d.runningBill.project?.name ?? "Unknown Project",
      runningBillNumber: d.runningBill.billNumber,
      type: d.type,
      typeLabel: d.label || DEDUCTION_TYPE_LABELS[d.type] || d.type,
      amount: Number(d.amount).toFixed(2),
      direction: "DEDUCTED",
      remarks: d.remarks ?? "",
    });
  }

  if (!query.type || query.type === "SECURITY_DEPOSIT") {
    for (const r of sdReleases) {
      if (!r.site) continue;
      entries.push({
        date: r.bankTransaction.transactionDate.toISOString().slice(0, 10),
        siteId: r.siteId ?? "",
        siteName: r.site.name,
        projectName: r.site.project?.name ?? "Unknown Project",
        runningBillNumber: "",
        type: "SECURITY_DEPOSIT",
        typeLabel: "Security Deposit Release",
        amount: Number(r.amount).toFixed(2),
        direction: "RELEASED",
        remarks: r.notes ?? "",
      });
    }
  }

  entries.sort((a, b) => b.date.localeCompare(a.date));
  return entries;
}
