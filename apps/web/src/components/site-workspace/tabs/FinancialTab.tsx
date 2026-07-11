import { useEffect, useState } from "react";
import {
  getSiteBudgetVsActualReport,
  getSiteCostBySubWorkReport,
  getSiteWallet,
  getSiteBillReceivedReport,
  getSiteVendorBillsReport,
  getSiteMoneyFlow,
} from "../../../services/site-control-center";
import type {
  SiteBudgetVsActual,
  SiteSubWorkRecapRow,
  SiteWallet,
  SiteBillReceivedRow,
  SiteVendorBillRow,
  SiteMoneyFlowRow,
} from "../../../services/site-control-center";
import { COST_HEAD_LABELS } from "../../../services/project-control-center";
import type { CostHeadKey } from "../../../services/project-control-center";
import type { Site } from "../../../services/sites";
import { RB_STATUS_LABELS } from "../../../services/running-bills";
import { VENDOR_BILL_STATUS_LABELS } from "../../../services/vendor-bills";
import { ALLOCATION_TYPE_LABELS } from "../../../services/transaction-allocations";
import LoadingState from "../../ui/LoadingState";
import { formatCurrency as inr } from "../../../lib/utils";
import EmptyTableRow from "../../ui/EmptyTableRow";

const HEAD_KEYS: CostHeadKey[] = ["material", "labour", "machinery", "fuel", "vendorBills", "siteExpenses", "other"];

export default function FinancialTab({ site }: { site: Site }) {
  const [summary, setSummary] = useState<SiteBudgetVsActual | null>(null);
  const [subWorkRows, setSubWorkRows] = useState<SiteSubWorkRecapRow[]>([]);
  const [wallet, setWallet] = useState<SiteWallet | null>(null);
  const [billReceived, setBillReceived] = useState<SiteBillReceivedRow[]>([]);
  const [vendorBills, setVendorBills] = useState<SiteVendorBillRow[]>([]);
  const [moneyFlow, setMoneyFlow] = useState<SiteMoneyFlowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getSiteBudgetVsActualReport(site.id),
      getSiteCostBySubWorkReport(site.id),
      getSiteWallet(site.id),
      getSiteBillReceivedReport(site.id),
      getSiteVendorBillsReport(site.id),
      getSiteMoneyFlow(site.id),
    ])
      .then(([s, rows, w, br, vb, mf]) => {
        setSummary(s);
        setSubWorkRows(rows);
        setWallet(w);
        setBillReceived(br);
        setVendorBills(vb);
        setMoneyFlow(mf);
      })
      .catch(() => setError("Failed to load financial summary."))
      .finally(() => setLoading(false));
  }, [site.id]);

  if (loading) return <LoadingState />;
  if (error || !summary) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Budget</p>
          <p className="mt-1 text-lg font-bold">{inr(summary.budget)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Actual</p>
          <p className="mt-1 text-lg font-bold">{inr(summary.actual)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Difference</p>
          <p className={`mt-1 text-lg font-bold ${Number(summary.difference) < 0 ? "text-red-600" : "text-emerald-600"}`}>{inr(summary.difference)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Variance Status</p>
          <p className="mt-1 text-lg font-bold capitalize">{summary.varianceStatus}</p>
        </div>
      </div>

      {wallet && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Site Wallet</h2>
          <p className="text-sm text-slate-500">Net cash this site has moved through the bank, from allocated bank transactions — Running Bill Receipts in, Site Expenses and Labour out.</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs text-emerald-700">Inflow (Running Bill Receipts)</p>
              <p className="mt-1 text-lg font-bold text-emerald-700">{inr(wallet.inflow)}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs text-red-700">Outflow (Site Expenses + Labour)</p>
              <p className="mt-1 text-lg font-bold text-red-700">{inr(wallet.outflow)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Wallet Balance</p>
              <p className={`mt-1 text-lg font-bold ${Number(wallet.balance) < 0 ? "text-red-600" : "text-emerald-600"}`}>{inr(wallet.balance)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Budget vs Actual by Cost Head</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Cost Head</th>
                <th className="px-4 py-3 text-right">Budget</th>
                <th className="px-4 py-3 text-right">Actual</th>
              </tr>
            </thead>
            <tbody>
              {HEAD_KEYS.map((key) => (
                <tr key={key} className="border-t">
                  <td className="px-4 py-3">{COST_HEAD_LABELS[key]}</td>
                  <td className="px-4 py-3 text-right">{inr(summary.budgetHeads[key])}</td>
                  <td className="px-4 py-3 text-right">{inr(summary.costHeads[key])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Cost by Sub Work</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Sub Work</th>
                <th className="px-4 py-3 text-right">Budget</th>
                <th className="px-4 py-3 text-right">Actual</th>
                <th className="px-4 py-3 text-right">Difference</th>
              </tr>
            </thead>
            <tbody>
              {subWorkRows.length === 0 ? (
                <EmptyTableRow colSpan={4}>No Sub Works yet.</EmptyTableRow>
              ) : (
                subWorkRows.map((r) => (
                  <tr key={r.subWorkId} className="border-t">
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3 text-right">{inr(r.budget)}</td>
                    <td className="px-4 py-3 text-right">{inr(r.actual)}</td>
                    <td className={`px-4 py-3 text-right ${Number(r.difference) < 0 ? "text-red-600" : "text-emerald-600"}`}>{inr(r.difference)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Bill Received (Client)</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">RA Number</th>
                <th className="px-4 py-3 text-left">Bill Date</th>
                <th className="px-4 py-3 text-right">Bill Amount</th>
                <th className="px-4 py-3 text-right">Received</th>
                <th className="px-4 py-3 text-right">Pending</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Bank Account(s)</th>
              </tr>
            </thead>
            <tbody>
              {billReceived.length === 0 ? (
                <EmptyTableRow colSpan={7}>No Running Bills yet.</EmptyTableRow>
              ) : (
                billReceived.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{b.raNumber}</td>
                    <td className="px-4 py-3">{b.billDate}</td>
                    <td className="px-4 py-3 text-right">{inr(b.billAmount)}</td>
                    <td className="px-4 py-3 text-right">{inr(b.receivedAmount)}</td>
                    <td className="px-4 py-3 text-right">{inr(b.pendingAmount)}</td>
                    <td className="px-4 py-3">{RB_STATUS_LABELS[b.status] ?? b.status}</td>
                    <td className="px-4 py-3 text-slate-500">{b.bankAccounts.join(", ") || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Vendor Bills</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Bill Number</th>
                <th className="px-4 py-3 text-left">Bill Date</th>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {vendorBills.length === 0 ? (
                <EmptyTableRow colSpan={7}>No Vendor Bills yet.</EmptyTableRow>
              ) : (
                vendorBills.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{b.billNumber}</td>
                    <td className="px-4 py-3">{b.billDate}</td>
                    <td className="px-4 py-3">{b.vendor}</td>
                    <td className="px-4 py-3 text-right">{inr(b.totalAmount)}</td>
                    <td className="px-4 py-3 text-right">{inr(b.paidAmount)}</td>
                    <td className="px-4 py-3 text-right">{inr(b.outstandingBalance)}</td>
                    <td className="px-4 py-3">{VENDOR_BILL_STATUS_LABELS[b.status] ?? b.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Money Flow</h2>
        <p className="text-sm text-slate-500">Chronological timeline behind the Site Wallet totals above — every allocation that has moved money in or out of this site.</p>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Direction</th>
                <th className="px-4 py-3 text-left">Reference</th>
                <th className="px-4 py-3 text-left">Bank Account</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {moneyFlow.length === 0 ? (
                <EmptyTableRow colSpan={6}>No money movement recorded yet.</EmptyTableRow>
              ) : (
                moneyFlow.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3">{r.date}</td>
                    <td className="px-4 py-3">{ALLOCATION_TYPE_LABELS[r.allocationType] ?? r.allocationType}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.direction === "IN" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {r.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{r.reference || "—"}</td>
                    <td className="px-4 py-3">{r.bankAccount}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(r.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
