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

type ReportTab = "register" | "outstanding" | "payments" | "recovery" | "project-summary";

const TABS: { key: ReportTab; label: string }[] = [
  { key: "register", label: "Running Bill Register" },
  { key: "outstanding", label: "Outstanding Bills" },
  { key: "payments", label: "Payment Register" },
  { key: "recovery", label: "Recovery Register" },
  { key: "project-summary", label: "Project Billing Summary" },
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

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = { projectId: projectFilter || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined };
      const [register, outstanding, paymentsReg, recovery, projectSummary] = await Promise.all([
        getRunningBillRegisterReport(query),
        getOutstandingBillsReport({ projectId: projectFilter || undefined }),
        getPaymentRegisterReport(query),
        getRecoveryRegisterReport(query),
        getProjectBillingSummaryReport({ projectId: projectFilter || undefined }),
      ]);
      setRegisterRows(register);
      setOutstandingRows(outstanding);
      setPaymentRows(paymentsReg);
      setRecoveryRows(recovery);
      setProjectSummaryRows(projectSummary);
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

  const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Running Bill Reports</h1>
            <p className="mt-2 text-slate-500">Register, outstanding bills, payments received, recoveries, and project billing summary.</p>
          </div>
          <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50 disabled:opacity-60">
            <Download className="h-4 w-4" /> {exporting ? "Exporting..." : "Export Register CSV"}
          </button>
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
                    <tr><td colSpan={10} className="py-10 text-center text-slate-500">No data.</td></tr>
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
                    <tr><td colSpan={8} className="py-10 text-center text-slate-500">No outstanding bills.</td></tr>
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
                    <tr><td colSpan={7} className="py-10 text-center text-slate-500">No data.</td></tr>
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
                    <tr><td colSpan={6} className="py-10 text-center text-slate-500">No data.</td></tr>
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
                    <tr><td colSpan={7} className="py-10 text-center text-slate-500">No data.</td></tr>
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
          </div>
        )}
      </div>
    </Layout>
  );
}
