import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import LoadingState from "../../components/ui/LoadingState";
import EmptyTableRow from "../../components/ui/EmptyTableRow";
import ReportExportBar from "../../components/ui/ReportExportBar";
import { getEmployees } from "../../services/employees";
import type { Employee } from "../../services/employees";
import { getEmployeeReport } from "../../services/employee-reports";
import type { EmployeeReport } from "../../services/employee-reports";
import { ALLOCATION_TYPE_LABELS } from "../../services/transaction-allocations";
import { formatCurrency as inr } from "../../lib/utils";

export default function EmployeeReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeId = searchParams.get("employeeId") ?? "";
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [report, setReport] = useState<EmployeeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEmployees({ limit: 100 }).then((r) => setEmployees(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getEmployeeReport({ employeeId: employeeId || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined })
      .then(setReport)
      .catch(() => setError("Failed to load employee report."))
      .finally(() => setLoading(false));
  }, [employeeId, fromDate, toDate]);

  const selectedEmployeeName = employees.find((e) => e.id === employeeId)?.name;
  const subtitleParts = [
    selectedEmployeeName ? `Employee: ${selectedEmployeeName}` : "All Employees",
    fromDate && `From ${fromDate}`,
    toDate && `To ${toDate}`,
  ].filter(Boolean);

  const exportInput = {
    title: "Employee Report",
    subtitle: subtitleParts.join(" | "),
    columns: [
      { key: "date", label: "Date" },
      { key: "employeeName", label: "Employee" },
      { key: "allocationType", label: "Type" },
      { key: "amount", label: "Amount", align: "right" as const },
      { key: "bankAccount", label: "Bank Account" },
      { key: "notes", label: "Notes" },
    ],
    rows:
      report?.transactions.map((t) => ({
        date: t.date,
        employeeName: t.employeeName,
        allocationType: ALLOCATION_TYPE_LABELS[t.allocationType] ?? t.allocationType,
        amount: t.amount,
        bankAccount: t.bankAccount,
        notes: t.notes,
      })) ?? [],
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Employee Reports</h1>
            <p className="mt-2 text-slate-500">Salary, Site Advances, and Personal Advances — generated from allocated bank transactions.</p>
          </div>
          <ReportExportBar input={exportInput} />
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm print:hidden">
          <select
            value={employeeId}
            onChange={(e) => setSearchParams(e.target.value ? { employeeId: e.target.value } : {})}
            className="rounded-lg border p-2.5"
          >
            <option value="">All Employees</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border p-2.5" />
            <label className="text-sm text-slate-500">To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border p-2.5" />
          </div>
        </div>

        {loading && <LoadingState label="Loading employee report..." />}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

        {!loading && !error && report && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Salary Paid</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{inr(report.grandTotal.salaryPaid)}</p>
              </div>
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Site Advances</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{inr(report.grandTotal.siteAdvances)}</p>
              </div>
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Personal Advances</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{inr(report.grandTotal.personalAdvances)}</p>
              </div>
              <div className="rounded-xl bg-blue-600 p-5 shadow-sm">
                <p className="text-sm text-blue-100">Grand Total</p>
                <p className="mt-1 text-2xl font-bold text-white">{inr(report.grandTotal.total)}</p>
              </div>
            </div>

            {!employeeId && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left">Employee</th>
                      <th className="px-4 py-3 text-right">Salary Paid</th>
                      <th className="px-4 py-3 text-right">Site Advances</th>
                      <th className="px-4 py-3 text-right">Personal Advances</th>
                      <th className="px-4 py-3 text-right">Grand Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.summary.length === 0 ? (
                      <EmptyTableRow colSpan={5}>No employee allocations yet.</EmptyTableRow>
                    ) : (
                      report.summary.map((s) => (
                        <tr key={s.employeeId} className="border-t">
                          <td className="px-4 py-3 font-medium">{s.employeeName}</td>
                          <td className="px-4 py-3 text-right">{inr(s.salaryPaid)}</td>
                          <td className="px-4 py-3 text-right">{inr(s.siteAdvances)}</td>
                          <td className="px-4 py-3 text-right">{inr(s.personalAdvances)}</td>
                          <td className="px-4 py-3 text-right font-medium">{inr(s.grandTotal)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3 font-semibold">Transaction History</div>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Employee</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Bank Account</th>
                    <th className="px-4 py-3 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {report.transactions.length === 0 ? (
                    <EmptyTableRow colSpan={6}>No transactions found for this filter.</EmptyTableRow>
                  ) : (
                    report.transactions.map((t) => (
                      <tr key={t.id} className="border-t">
                        <td className="px-4 py-3">{t.date}</td>
                        <td className="px-4 py-3">{t.employeeName}</td>
                        <td className="px-4 py-3">{ALLOCATION_TYPE_LABELS[t.allocationType] ?? t.allocationType}</td>
                        <td className="px-4 py-3 text-right">{inr(t.amount)}</td>
                        <td className="px-4 py-3">{t.bankAccount || "—"}</td>
                        <td className="px-4 py-3 text-slate-500">{t.notes || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
