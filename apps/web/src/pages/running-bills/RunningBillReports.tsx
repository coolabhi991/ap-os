import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import Layout from "../../components/layout/Layout";
import {
  getRunningBillRegisterReport,
  getOutstandingBillsReport,
  getPaymentRegisterReport,
  getRecoveryRegisterReport,
  getProjectBillingSummaryReport,
  exportRunningBillRegisterCSV,
  RB_STATUS_LABELS,
  RB_STATUS_COLORS,
  BILL_TYPE_LABELS,
  DEDUCTION_TYPE_LABELS,
} from "../../services/running-bills";
import type { RunningBill, OutstandingBillRow, PaymentRegisterRow, RecoveryRegisterRow, ProjectBillingSummaryRow } from "../../services/running-bills";
import { getProjects } from "../../services/projects";
import { formatCurrency as inr } from "../../lib/utils";
import EmptyTableRow from "../../components/ui/EmptyTableRow";
import ReportExportBar from "../../components/ui/ReportExportBar";
import type { ReportExportInput } from "../../lib/report-export";
import {
  getSiteWiseDeductions,
  getClientWiseDeductions,
  getSDPendingReport,
  getRecoveryLedger,
} from "../../services/deduction-ledger";
import type { SiteWiseDeductionRow, ClientWiseDeductionRow, SDPendingRow, RecoveryLedgerEntry } from "../../services/deduction-ledger";

type ReportTab =
  | "register"
  | "outstanding"
  | "payments"
  | "recovery"
  | "project-summary"
  | "site-deductions"
  | "client-deductions"
  | "sd-pending"
  | "recovery-ledger";

const TABS: { key: ReportTab; label: string }[] = [
  { key: "register", label: "Running Bill Register" },
  { key: "outstanding", label: "Outstanding Bills" },
  { key: "payments", label: "Payment Register" },
  { key: "recovery", label: "Recovery Register" },
  { key: "project-summary", label: "Project Billing Summary" },
  { key: "site-deductions", label: "Site-wise Deductions" },
  { key: "client-deductions", label: "Client-wise Deductions" },
  { key: "sd-pending", label: "SD Pending" },
  { key: "recovery-ledger", label: "Recovery Ledger" },
];

export default function RunningBillReports() {
  const [tab, setTab] = useState<ReportTab>("register");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [registerRows, setRegisterRows] = useState<RunningBill[]>([]);
  const [outstandingRows, setOutstandingRows] = useState<OutstandingBillRow[]>([]);
  const [paymentRows, setPaymentRows] = useState<PaymentRegisterRow[]>([]);
  const [recoveryRows, setRecoveryRows] = useState<RecoveryRegisterRow[]>([]);
  const [projectSummaryRows, setProjectSummaryRows] = useState<ProjectBillingSummaryRow[]>([]);
  const [siteDeductionRows, setSiteDeductionRows] = useState<SiteWiseDeductionRow[]>([]);
  const [clientDeductionRows, setClientDeductionRows] = useState<ClientWiseDeductionRow[]>([]);
  const [sdPendingRows, setSdPendingRows] = useState<SDPendingRow[]>([]);
  const [recoveryLedgerRows, setRecoveryLedgerRows] = useState<RecoveryLedgerEntry[]>([]);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = { projectId: projectFilter || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined };
      const [register, outstanding, paymentsReg, recovery, projectSummary, siteDeductions, clientDeductions, sdPending, recoveryLedger] = await Promise.all([
        getRunningBillRegisterReport(query),
        getOutstandingBillsReport({ projectId: projectFilter || undefined }),
        getPaymentRegisterReport(query),
        getRecoveryRegisterReport(query),
        getProjectBillingSummaryReport({ projectId: projectFilter || undefined }),
        getSiteWiseDeductions(query),
        getClientWiseDeductions(query),
        getSDPendingReport(query),
        getRecoveryLedger(query),
      ]);
      setRegisterRows(register);
      setOutstandingRows(outstanding);
      setPaymentRows(paymentsReg);
      setRecoveryRows(recovery);
      setProjectSummaryRows(projectSummary);
      setSiteDeductionRows(siteDeductions);
      setClientDeductionRows(clientDeductions);
      setSdPendingRows(sdPending);
      setRecoveryLedgerRows(recoveryLedger);
    } catch {
      setError("Failed to load Running Bill reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectFilter, fromDate, toDate]);

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportRunningBillRegisterCSV({ projectId: projectFilter || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined });
    } catch {
      alert("Failed to export Running Bill Register.");
    } finally {
      setExporting(false);
    }
  };

  const filterSubtitle = [
    projectFilter ? `Project: ${projects.find((p) => p.id === projectFilter)?.name ?? projectFilter}` : "All Projects",
    fromDate && `From ${fromDate}`,
    toDate && `To ${toDate}`,
  ]
    .filter(Boolean)
    .join(" | ");

  const sum = (rows: Record<string, string>[], key: string) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0).toFixed(2);

  const buildExportInput = (): ReportExportInput | null => {
    switch (tab) {
      case "register":
        return {
          title: "Running Bill Register",
          subtitle: filterSubtitle,
          columns: [
            { key: "billNumber", label: "Bill #" },
            { key: "billDate", label: "Date" },
            { key: "project", label: "Project" },
            { key: "billType", label: "Type" },
            { key: "currentCertifiedAmount", label: "Current Certified", align: "right" as const },
            { key: "totalDeductions", label: "Deductions", align: "right" as const },
            { key: "netPayable", label: "Net Payable", align: "right" as const },
            { key: "amountReceived", label: "Received", align: "right" as const },
            { key: "outstandingAmount", label: "Outstanding", align: "right" as const },
            { key: "status", label: "Status" },
          ],
          rows: registerRows.map((r) => ({
            billNumber: r.billNumber,
            billDate: r.billDate,
            project: r.project?.name ?? "",
            billType: BILL_TYPE_LABELS[r.billType] ?? r.billType,
            currentCertifiedAmount: r.currentCertifiedAmount,
            totalDeductions: r.totalDeductions,
            netPayable: r.netPayable,
            amountReceived: r.amountReceived,
            outstandingAmount: r.outstandingAmount,
            status: RB_STATUS_LABELS[r.status] ?? r.status,
          })),
          totals: {
            billNumber: "TOTAL",
            currentCertifiedAmount: sum(registerRows as unknown as Record<string, string>[], "currentCertifiedAmount"),
            totalDeductions: sum(registerRows as unknown as Record<string, string>[], "totalDeductions"),
            netPayable: sum(registerRows as unknown as Record<string, string>[], "netPayable"),
            amountReceived: sum(registerRows as unknown as Record<string, string>[], "amountReceived"),
            outstandingAmount: sum(registerRows as unknown as Record<string, string>[], "outstandingAmount"),
          },
        };
      case "outstanding":
        return {
          title: "Outstanding Bills",
          subtitle: filterSubtitle,
          columns: [
            { key: "billNumber", label: "Bill #" },
            { key: "billDate", label: "Date" },
            { key: "project", label: "Project" },
            { key: "netPayable", label: "Net Payable", align: "right" as const },
            { key: "amountReceived", label: "Received", align: "right" as const },
            { key: "outstandingAmount", label: "Outstanding", align: "right" as const },
            { key: "daysOutstanding", label: "Days Outstanding", align: "right" as const },
          ],
          rows: outstandingRows.map((r) => ({
            billNumber: r.billNumber,
            billDate: r.billDate,
            project: r.project?.name ?? "",
            netPayable: r.netPayable,
            amountReceived: r.amountReceived,
            outstandingAmount: r.outstandingAmount,
            daysOutstanding: r.daysOutstanding,
          })),
          totals: { billNumber: "TOTAL", outstandingAmount: sum(outstandingRows as unknown as Record<string, string>[], "outstandingAmount") },
        };
      case "payments":
        return {
          title: "Payment Register",
          subtitle: filterSubtitle,
          columns: [
            { key: "paymentNumber", label: "Payment #" },
            { key: "paymentDate", label: "Date" },
            { key: "billNumber", label: "Bill #" },
            { key: "project", label: "Project" },
            { key: "amount", label: "Amount", align: "right" as const },
            { key: "mode", label: "Mode" },
          ],
          rows: paymentRows.map((p) => ({
            paymentNumber: p.paymentNumber,
            paymentDate: p.paymentDate,
            billNumber: p.runningBill?.billNumber ?? "",
            project: p.project?.name ?? "",
            amount: p.amount,
            mode: p.mode,
          })),
          totals: { paymentNumber: "TOTAL", amount: sum(paymentRows as unknown as Record<string, string>[], "amount") },
        };
      case "recovery":
        return {
          title: "Recovery Register",
          subtitle: filterSubtitle,
          columns: [
            { key: "billNumber", label: "Bill #" },
            { key: "billDate", label: "Date" },
            { key: "project", label: "Project" },
            { key: "type", label: "Type" },
            { key: "label", label: "Label" },
            { key: "amount", label: "Amount", align: "right" as const },
          ],
          rows: recoveryRows.map((r) => ({
            billNumber: r.billNumber,
            billDate: r.billDate,
            project: r.project,
            type: DEDUCTION_TYPE_LABELS[r.type] ?? r.type,
            label: r.label,
            amount: r.amount,
          })),
          totals: { billNumber: "TOTAL", amount: sum(recoveryRows as unknown as Record<string, string>[], "amount") },
        };
      case "project-summary":
        return {
          title: "Project Billing Summary",
          columns: [
            { key: "projectName", label: "Project" },
            { key: "contractValue", label: "Contract Value", align: "right" as const },
            { key: "billsSubmittedCount", label: "Bills Submitted", align: "right" as const },
            { key: "totalBillsSubmitted", label: "Total Certified", align: "right" as const },
            { key: "totalAmountReceived", label: "Total Received", align: "right" as const },
            { key: "outstandingAmount", label: "Outstanding", align: "right" as const },
          ],
          rows: projectSummaryRows.map((r) => ({
            projectName: r.projectName,
            contractValue: r.contractValue,
            billsSubmittedCount: r.billsSubmittedCount,
            totalBillsSubmitted: r.totalBillsSubmitted,
            totalAmountReceived: r.totalAmountReceived,
            outstandingAmount: r.outstandingAmount,
          })),
        };
      case "site-deductions":
        return {
          title: "Site-wise Deductions",
          subtitle: filterSubtitle,
          columns: [
            { key: "siteName", label: "Site" },
            { key: "sdDeducted", label: "SD Deducted", align: "right" as const },
            { key: "sdReleased", label: "SD Released", align: "right" as const },
            { key: "sdPending", label: "SD Pending", align: "right" as const },
            { key: "gst", label: "GST", align: "right" as const },
            { key: "tds", label: "TDS", align: "right" as const },
            { key: "labourCess", label: "Labour Cess", align: "right" as const },
            { key: "royalty", label: "Royalty", align: "right" as const },
            { key: "insurance", label: "Insurance", align: "right" as const },
            { key: "other", label: "Other", align: "right" as const },
            { key: "totalDeductions", label: "Total", align: "right" as const },
          ],
          rows: siteDeductionRows as unknown as Record<string, string>[],
          totals: {
            siteName: "TOTAL",
            sdDeducted: sum(siteDeductionRows as unknown as Record<string, string>[], "sdDeducted"),
            sdReleased: sum(siteDeductionRows as unknown as Record<string, string>[], "sdReleased"),
            sdPending: sum(siteDeductionRows as unknown as Record<string, string>[], "sdPending"),
            gst: sum(siteDeductionRows as unknown as Record<string, string>[], "gst"),
            tds: sum(siteDeductionRows as unknown as Record<string, string>[], "tds"),
            labourCess: sum(siteDeductionRows as unknown as Record<string, string>[], "labourCess"),
            royalty: sum(siteDeductionRows as unknown as Record<string, string>[], "royalty"),
            insurance: sum(siteDeductionRows as unknown as Record<string, string>[], "insurance"),
            other: sum(siteDeductionRows as unknown as Record<string, string>[], "other"),
            totalDeductions: sum(siteDeductionRows as unknown as Record<string, string>[], "totalDeductions"),
          },
        };
      case "client-deductions":
        return {
          title: "Client-wise Deductions",
          subtitle: filterSubtitle,
          columns: [
            { key: "clientName", label: "Client" },
            { key: "sdDeducted", label: "SD Deducted", align: "right" as const },
            { key: "gst", label: "GST", align: "right" as const },
            { key: "tds", label: "TDS", align: "right" as const },
            { key: "labourCess", label: "Labour Cess", align: "right" as const },
            { key: "royalty", label: "Royalty", align: "right" as const },
            { key: "insurance", label: "Insurance", align: "right" as const },
            { key: "other", label: "Other", align: "right" as const },
            { key: "totalDeductions", label: "Total", align: "right" as const },
          ],
          rows: clientDeductionRows as unknown as Record<string, string>[],
          totals: {
            clientName: "TOTAL",
            totalDeductions: sum(clientDeductionRows as unknown as Record<string, string>[], "totalDeductions"),
          },
        };
      case "sd-pending":
        return {
          title: "SD Pending Report",
          subtitle: filterSubtitle,
          columns: [
            { key: "siteName", label: "Site" },
            { key: "projectName", label: "Project" },
            { key: "sdDeducted", label: "SD Deducted", align: "right" as const },
            { key: "sdReleased", label: "SD Released", align: "right" as const },
            { key: "sdPending", label: "SD Pending", align: "right" as const },
          ],
          rows: sdPendingRows as unknown as Record<string, string>[],
          totals: {
            siteName: "TOTAL",
            sdDeducted: sum(sdPendingRows as unknown as Record<string, string>[], "sdDeducted"),
            sdReleased: sum(sdPendingRows as unknown as Record<string, string>[], "sdReleased"),
            sdPending: sum(sdPendingRows as unknown as Record<string, string>[], "sdPending"),
          },
        };
      case "recovery-ledger":
        return {
          title: "Recovery Ledger",
          subtitle: filterSubtitle,
          columns: [
            { key: "date", label: "Date" },
            { key: "siteName", label: "Site" },
            { key: "runningBillNumber", label: "Running Bill" },
            { key: "typeLabel", label: "Type" },
            { key: "direction", label: "Direction" },
            { key: "amount", label: "Amount", align: "right" as const },
            { key: "remarks", label: "Remarks" },
          ],
          rows: recoveryLedgerRows as unknown as Record<string, string>[],
        };
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Running Bill Reports</h1>
            <p className="mt-2 text-slate-500">Register, outstanding bills, payments received, recoveries, and project billing summary.</p>
          </div>
          <div className="flex items-center gap-2">
            {buildExportInput() && <ReportExportBar input={buildExportInput()!} />}
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50 disabled:opacity-60">
              <Download className="h-4 w-4" /> {exporting ? "Exporting..." : "Export Register CSV"}
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="rounded-lg border p-2.5">
              <option value="">All Projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label className="whitespace-nowrap text-sm text-slate-500">From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border p-2.5" />
            <label className="whitespace-nowrap text-sm text-slate-500">To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border p-2.5" />
            <p className="ml-2 text-xs text-slate-400">Date range applies to Bill Date. Outstanding Bills and Project Billing Summary always show the current, all-time balance.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === t.key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {tab === "register" && (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Bill #</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Project</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-right">Current Certified</th>
                    <th className="px-4 py-3 text-right">Deductions</th>
                    <th className="px-4 py-3 text-right">Net Payable</th>
                    <th className="px-4 py-3 text-right">Received</th>
                    <th className="px-4 py-3 text-right">Outstanding</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registerRows.length === 0 ? (
                    <EmptyTableRow colSpan={10}>No data.</EmptyTableRow>
                  ) : (
                    registerRows.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="px-4 py-3 font-medium">{r.billNumber}</td>
                        <td className="px-4 py-3">{r.billDate}</td>
                        <td className="px-4 py-3">{r.project?.name ?? "—"}</td>
                        <td className="px-4 py-3">{BILL_TYPE_LABELS[r.billType] ?? r.billType}</td>
                        <td className="px-4 py-3 text-right">{inr(r.currentCertifiedAmount)}</td>
                        <td className="px-4 py-3 text-right text-red-600">{inr(r.totalDeductions)}</td>
                        <td className="px-4 py-3 text-right font-medium">{inr(r.netPayable)}</td>
                        <td className="px-4 py-3 text-right">{inr(r.amountReceived)}</td>
                        <td className="px-4 py-3 text-right font-medium text-amber-600">{inr(r.outstandingAmount)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${RB_STATUS_COLORS[r.status]}`}>{RB_STATUS_LABELS[r.status] ?? r.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === "outstanding" && (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">Bill #</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Project</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-right">Net Payable</th>
                    <th className="px-6 py-4 text-right">Received</th>
                    <th className="px-6 py-4 text-right">Outstanding</th>
                    <th className="px-6 py-4 text-right">Days Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingRows.length === 0 ? (
                    <EmptyTableRow colSpan={8}>No outstanding bills.</EmptyTableRow>
                  ) : (
                    outstandingRows.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="px-6 py-4 font-medium">{r.billNumber}</td>
                        <td className="px-6 py-4">{r.billDate}</td>
                        <td className="px-6 py-4">{r.project?.name ?? "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${RB_STATUS_COLORS[r.status]}`}>{RB_STATUS_LABELS[r.status] ?? r.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">{inr(r.netPayable)}</td>
                        <td className="px-6 py-4 text-right">{inr(r.amountReceived)}</td>
                        <td className="px-6 py-4 text-right font-medium text-amber-600">{inr(r.outstandingAmount)}</td>
                        <td className="px-6 py-4 text-right">{r.daysOutstanding}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === "payments" && (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">Payment #</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Bill #</th>
                    <th className="px-6 py-4 text-left">Project</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-left">Mode</th>
                    <th className="px-6 py-4 text-left">Bank Account</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRows.length === 0 ? (
                    <EmptyTableRow colSpan={7}>No data.</EmptyTableRow>
                  ) : (
                    paymentRows.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="px-6 py-4 font-medium">{p.paymentNumber}</td>
                        <td className="px-6 py-4">{p.paymentDate}</td>
                        <td className="px-6 py-4">{p.runningBill?.billNumber ?? "—"}</td>
                        <td className="px-6 py-4">{p.project?.name ?? "—"}</td>
                        <td className="px-6 py-4 text-right font-medium text-emerald-600">{inr(p.amount)}</td>
                        <td className="px-6 py-4">{p.mode}</td>
                        <td className="px-6 py-4 text-slate-500">{p.companyBankAccount ? `${p.companyBankAccount.bankName} (${p.companyBankAccount.accountNumber})` : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === "recovery" && (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">Bill #</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Project</th>
                    <th className="px-6 py-4 text-left">Type</th>
                    <th className="px-6 py-4 text-left">Label</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recoveryRows.length === 0 ? (
                    <EmptyTableRow colSpan={6}>No data.</EmptyTableRow>
                  ) : (
                    recoveryRows.map((r, i) => (
                      <tr key={`${r.billId}-${i}`} className="border-t">
                        <td className="px-6 py-4 font-medium">{r.billNumber}</td>
                        <td className="px-6 py-4">{r.billDate}</td>
                        <td className="px-6 py-4">{r.project}</td>
                        <td className="px-6 py-4">{DEDUCTION_TYPE_LABELS[r.type] ?? r.type}</td>
                        <td className="px-6 py-4">{r.label}</td>
                        <td className="px-6 py-4 text-right font-medium text-red-600">{inr(r.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === "project-summary" && (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">Project</th>
                    <th className="px-6 py-4 text-right">Contract Value</th>
                    <th className="px-6 py-4 text-right">Bills Submitted</th>
                    <th className="px-6 py-4 text-right">Total Certified</th>
                    <th className="px-6 py-4 text-right">Total Received</th>
                    <th className="px-6 py-4 text-right">Outstanding</th>
                    <th className="px-6 py-4 text-right">Balance Contract Value</th>
                  </tr>
                </thead>
                <tbody>
                  {projectSummaryRows.length === 0 ? (
                    <EmptyTableRow colSpan={7}>No data.</EmptyTableRow>
                  ) : (
                    projectSummaryRows.map((r) => (
                      <tr key={r.projectId} className="border-t">
                        <td className="px-6 py-4 font-medium">{r.projectName}</td>
                        <td className="px-6 py-4 text-right">{inr(r.contractValue)}</td>
                        <td className="px-6 py-4 text-right">{r.billsSubmittedCount}</td>
                        <td className="px-6 py-4 text-right">{inr(r.totalBillsSubmitted)}</td>
                        <td className="px-6 py-4 text-right text-emerald-600">{inr(r.totalAmountReceived)}</td>
                        <td className="px-6 py-4 text-right text-amber-600">{inr(r.outstandingAmount)}</td>
                        <td className="px-6 py-4 text-right font-medium">{inr(r.balanceContractValue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === "site-deductions" && (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Site</th>
                    <th className="px-4 py-3 text-right">SD Deducted</th>
                    <th className="px-4 py-3 text-right">SD Released</th>
                    <th className="px-4 py-3 text-right">SD Pending</th>
                    <th className="px-4 py-3 text-right">GST</th>
                    <th className="px-4 py-3 text-right">TDS</th>
                    <th className="px-4 py-3 text-right">Labour Cess</th>
                    <th className="px-4 py-3 text-right">Royalty</th>
                    <th className="px-4 py-3 text-right">Insurance</th>
                    <th className="px-4 py-3 text-right">Other</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {siteDeductionRows.length === 0 ? (
                    <EmptyTableRow colSpan={11}>No deductions recorded yet.</EmptyTableRow>
                  ) : (
                    siteDeductionRows.map((r) => (
                      <tr key={r.siteId} className="border-t">
                        <td className="px-4 py-3 font-medium">{r.siteName}</td>
                        <td className="px-4 py-3 text-right">{inr(r.sdDeducted)}</td>
                        <td className="px-4 py-3 text-right">{inr(r.sdReleased)}</td>
                        <td className="px-4 py-3 text-right font-medium text-amber-600">{inr(r.sdPending)}</td>
                        <td className="px-4 py-3 text-right">{inr(r.gst)}</td>
                        <td className="px-4 py-3 text-right">{inr(r.tds)}</td>
                        <td className="px-4 py-3 text-right">{inr(r.labourCess)}</td>
                        <td className="px-4 py-3 text-right">{inr(r.royalty)}</td>
                        <td className="px-4 py-3 text-right">{inr(r.insurance)}</td>
                        <td className="px-4 py-3 text-right">{inr(r.other)}</td>
                        <td className="px-4 py-3 text-right font-medium">{inr(r.totalDeductions)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === "client-deductions" && (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Client</th>
                    <th className="px-4 py-3 text-right">SD Deducted</th>
                    <th className="px-4 py-3 text-right">GST</th>
                    <th className="px-4 py-3 text-right">TDS</th>
                    <th className="px-4 py-3 text-right">Labour Cess</th>
                    <th className="px-4 py-3 text-right">Royalty</th>
                    <th className="px-4 py-3 text-right">Insurance</th>
                    <th className="px-4 py-3 text-right">Other</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {clientDeductionRows.length === 0 ? (
                    <EmptyTableRow colSpan={9}>No deductions recorded yet.</EmptyTableRow>
                  ) : (
                    clientDeductionRows.map((r, i) => (
                      <tr key={r.clientId || `none-${i}`} className="border-t">
                        <td className="px-4 py-3 font-medium">{r.clientName}</td>
                        <td className="px-4 py-3 text-right">{inr(r.sdDeducted)}</td>
                        <td className="px-4 py-3 text-right">{inr(r.gst)}</td>
                        <td className="px-4 py-3 text-right">{inr(r.tds)}</td>
                        <td className="px-4 py-3 text-right">{inr(r.labourCess)}</td>
                        <td className="px-4 py-3 text-right">{inr(r.royalty)}</td>
                        <td className="px-4 py-3 text-right">{inr(r.insurance)}</td>
                        <td className="px-4 py-3 text-right">{inr(r.other)}</td>
                        <td className="px-4 py-3 text-right font-medium">{inr(r.totalDeductions)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === "sd-pending" && (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">Site</th>
                    <th className="px-6 py-4 text-left">Project</th>
                    <th className="px-6 py-4 text-right">SD Deducted</th>
                    <th className="px-6 py-4 text-right">SD Released</th>
                    <th className="px-6 py-4 text-right">SD Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {sdPendingRows.length === 0 ? (
                    <EmptyTableRow colSpan={5}>No Security Deposit activity yet.</EmptyTableRow>
                  ) : (
                    sdPendingRows.map((r) => (
                      <tr key={r.siteId} className="border-t">
                        <td className="px-6 py-4 font-medium">{r.siteName}</td>
                        <td className="px-6 py-4">{r.projectName}</td>
                        <td className="px-6 py-4 text-right">{inr(r.sdDeducted)}</td>
                        <td className="px-6 py-4 text-right">{inr(r.sdReleased)}</td>
                        <td className="px-6 py-4 text-right font-medium text-amber-600">{inr(r.sdPending)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === "recovery-ledger" && (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Site</th>
                    <th className="px-4 py-3 text-left">Running Bill</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Direction</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {recoveryLedgerRows.length === 0 ? (
                    <EmptyTableRow colSpan={7}>No recovery activity yet.</EmptyTableRow>
                  ) : (
                    recoveryLedgerRows.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-3">{r.date}</td>
                        <td className="px-4 py-3">{r.siteName}</td>
                        <td className="px-4 py-3">{r.runningBillNumber || "—"}</td>
                        <td className="px-4 py-3">{r.typeLabel}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.direction === "DEDUCTED" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {r.direction === "DEDUCTED" ? "Deducted" : "Released"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{inr(r.amount)}</td>
                        <td className="px-4 py-3 text-slate-500">{r.remarks || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
