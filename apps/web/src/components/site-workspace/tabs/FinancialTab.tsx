import { useEffect, useState } from "react";
import {
  getSiteBudgetVsActualReport,
  getSiteSubWorkFinancialSummary,
  getSiteWallet,
  getSiteBillReceivedReport,
  getSiteVendorBillsReport,
  getSiteMoneyFlow,
  getSiteFinancialSummary,
} from "../../../services/site-control-center";
import type {
  SiteBudgetVsActual,
  SubWorkFinancialSummary,
  SiteWallet,
  SiteBillReceivedRow,
  SiteVendorBillRow,
  SiteMoneyFlowRow,
  SiteFinancialSummary,
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
  const [subWorkFinancial, setSubWorkFinancial] = useState<SubWorkFinancialSummary | null>(null);
  const [wallet, setWallet] = useState<SiteWallet | null>(null);
  const [billReceived, setBillReceived] = useState<SiteBillReceivedRow[]>([]);
  const [vendorBills, setVendorBills] = useState<SiteVendorBillRow[]>([]);
  const [moneyFlow, setMoneyFlow] = useState<SiteMoneyFlowRow[]>([]);
  const [financialSummary, setFinancialSummary] = useState<SiteFinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getSiteBudgetVsActualReport(site.id),
      getSiteSubWorkFinancialSummary(site.id),
      getSiteWallet(site.id),
      getSiteBillReceivedReport(site.id),
      getSiteVendorBillsReport(site.id),
      getSiteMoneyFlow(site.id),
      getSiteFinancialSummary(site.id),
    ])
      .then(([s, swf, w, br, vb, mf, fs]) => {
        setSummary(s);
        setSubWorkFinancial(swf);
        setWallet(w);
        setBillReceived(br);
        setVendorBills(vb);
        setMoneyFlow(mf);
        setFinancialSummary(fs);
      })
      .catch(() => setError("Failed to load financial summary."))
      .finally(() => setLoading(false));
  }, [site.id]);

  if (loading) return <LoadingState />;
  if (error || !summary) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <div className="space-y-6">
      {financialSummary && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Site Financial Summary — Form 58 Billing</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Agreement Value</p>
              <p className="mt-1 text-lg font-bold">{inr(financialSummary.agreementValue)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Total RA Bills</p>
              <p className="mt-1 text-lg font-bold">{financialSummary.totalRABills}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Gross Billing</p>
              <p className="mt-1 text-lg font-bold">{inr(financialSummary.grossBilling)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Total Deductions</p>
              <p className="mt-1 text-lg font-bold text-red-600">{inr(financialSummary.totalDeductions)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Net Bills Raised</p>
              <p className="mt-1 text-lg font-bold">{inr(financialSummary.netBillsRaised)}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs text-emerald-700">Client Payments Received</p>
              <p className="mt-1 text-lg font-bold text-emerald-700">{inr(financialSummary.clientPaymentsReceived)}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs text-amber-700">Outstanding Amount</p>
              <p className="mt-1 text-lg font-bold text-amber-700">{inr(financialSummary.outstandingAmount)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Remaining Agreement Value</p>
              <p className="mt-1 text-lg font-bold">{inr(financialSummary.remainingAgreementValue)}</p>
            </div>
          </div>
          <details className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-700">Deduction breakdown</summary>
            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 p-4 text-sm md:grid-cols-4">
              <div><p className="text-slate-500">GST State</p><p className="font-medium">{inr(financialSummary.gstStateTotal)}</p></div>
              <div><p className="text-slate-500">GST Central</p><p className="font-medium">{inr(financialSummary.gstCentralTotal)}</p></div>
              <div><p className="text-slate-500">Income Tax</p><p className="font-medium">{inr(financialSummary.incomeTaxTotal)}</p></div>
              <div><p className="text-slate-500">Security Deposit</p><p className="font-medium">{inr(financialSummary.securityDepositTotal)}</p></div>
              <div><p className="text-slate-500">Royalty</p><p className="font-medium">{inr(financialSummary.royaltyTotal)}</p></div>
              <div><p className="text-slate-500">Insurance</p><p className="font-medium">{inr(financialSummary.insuranceTotal)}</p></div>
              <div><p className="text-slate-500">Fine</p><p className="font-medium">{inr(financialSummary.fineTotal)}</p></div>
              <div><p className="text-slate-500">Labour Cess</p><p className="font-medium">{inr(financialSummary.labourCessTotal)}</p></div>
              <div><p className="text-slate-500">Other</p><p className="font-medium">{inr(financialSummary.otherDeductionsTotal)}</p></div>
            </div>
          </details>
        </div>
      )}

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
        <h2 className="text-lg font-bold text-slate-900">Sub Work Financial Summary</h2>
        <p className="text-sm text-slate-500">
          Contract Value comes from the Recapitulation Register; Total Certified is the latest RA Bill's cumulative figure per section.
          Client Payment Received is apportioned across sections by their share of that bill's certified total — not an itemized ledger.
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Sub Work</th>
                <th className="px-4 py-3 text-right">Contract Value</th>
                <th className="px-4 py-3 text-right">Certified Till Date</th>
                <th className="px-4 py-3 text-right">Client Payment Received</th>
                <th className="px-4 py-3 text-right">Outstanding Payment</th>
                <th className="px-4 py-3 text-right">Remaining Contract Value</th>
                <th className="px-4 py-3 text-right">Progress %</th>
              </tr>
            </thead>
            <tbody>
              {!subWorkFinancial || subWorkFinancial.rows.length === 0 ? (
                <EmptyTableRow colSpan={7}>No Recapitulation rows yet — add rows in the Recapitulation tab.</EmptyTableRow>
              ) : (
                <>
                  {subWorkFinancial.rows.map((r) => (
                    <tr key={r.subWorkId} className="border-t">
                      <td className="px-4 py-3 font-medium">{r.particular}</td>
                      <td className="px-4 py-3 text-right">{inr(r.contractValue)}</td>
                      <td className="px-4 py-3 text-right">{inr(r.certifiedTillDate)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">{inr(r.clientPaymentReceived)}</td>
                      <td className="px-4 py-3 text-right text-amber-600">{inr(r.outstandingPayment)}</td>
                      <td className="px-4 py-3 text-right">{inr(r.remainingContractValue)}</td>
                      <td className="px-4 py-3 text-right">{r.progressPercent}%</td>
                    </tr>
                  ))}
                  <tr className="border-t bg-slate-50 font-bold">
                    <td className="px-4 py-3">Site Total</td>
                    <td className="px-4 py-3 text-right">{inr(subWorkFinancial.site.contractValue)}</td>
                    <td className="px-4 py-3 text-right">{inr(subWorkFinancial.site.certifiedTillDate)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{inr(subWorkFinancial.site.clientPaymentReceived)}</td>
                    <td className="px-4 py-3 text-right text-amber-700">{inr(subWorkFinancial.site.outstandingPayment)}</td>
                    <td className="px-4 py-3 text-right">{inr(subWorkFinancial.site.remainingContractValue)}</td>
                    <td className="px-4 py-3 text-right">—</td>
                  </tr>
                </>
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
