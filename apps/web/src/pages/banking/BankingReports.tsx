import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, Printer, Mail } from "lucide-react";

import Layout from "../../components/layout/Layout";
import EmailReportModal from "../../components/banking/EmailReportModal";
import {
  getBankBookReport,
  getCashBookReport,
  getBankReconciliationReport,
  getCashFlowReport,
  getReceivablesReport,
  getPayablesReport,
  getOutstandingSummary,
  exportReceivablesCSV,
  exportPayablesCSV,
  exportBankBookCSV,
  exportBankBookPdf,
  exportBankBookExcel,
  exportCashBookCSV,
  exportCashBookPdf,
  exportCashBookExcel,
  sendBankBookEmail,
  sendCashBookEmail,
} from "../../services/banking-reports";
import type {
  BankBookReport,
  CashBookReport,
  BankReconciliationReport,
  CashFlowReport,
  ReceivableRow,
  PayableRow,
  OutstandingSummary,
} from "../../services/banking-reports";
import { getBankAccountsWithBalances, RECONCILIATION_STATUS_LABELS, RECONCILIATION_STATUS_COLORS } from "../../services/bank-transactions";
import type { BankAccountBalance } from "../../services/bank-transactions";
import { getProjects } from "../../services/projects";

type ReportTab = "bank-book" | "cash-book" | "reconciliation" | "cash-flow" | "receivables" | "payables" | "outstanding-summary";

const TABS: { key: ReportTab; label: string }[] = [
  { key: "bank-book", label: "Bank Book" },
  { key: "cash-book", label: "Cash Book" },
  { key: "reconciliation", label: "Bank Reconciliation" },
  { key: "cash-flow", label: "Cash Flow" },
  { key: "receivables", label: "Receivable Report" },
  { key: "payables", label: "Payable Report" },
  { key: "outstanding-summary", label: "Outstanding Summary" },
];

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

export default function BankingReports() {
  const [tab, setTab] = useState<ReportTab>("bank-book");
  const [accounts, setAccounts] = useState<BankAccountBalance[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [accountId, setAccountId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState<"bank-book" | "cash-book" | null>(null);

  const [bankBook, setBankBook] = useState<BankBookReport | null>(null);
  const [cashBook, setCashBook] = useState<CashBookReport | null>(null);
  const [reconciliation, setReconciliation] = useState<BankReconciliationReport | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowReport | null>(null);
  const [receivables, setReceivables] = useState<ReceivableRow[]>([]);
  const [payables, setPayables] = useState<PayableRow[]>([]);
  const [outstandingSummary, setOutstandingSummary] = useState<OutstandingSummary | null>(null);

  useEffect(() => {
    getBankAccountsWithBalances().then((a) => {
      setAccounts(a);
      if (a.length && !accountId) setAccountId(a[0].id);
    }).catch(() => {});
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [bb, cb, recon, cf, recv, pay, summary] = await Promise.all([
        accountId ? getBankBookReport({ companyBankAccountId: accountId, fromDate: fromDate || undefined, toDate: toDate || undefined }) : Promise.resolve(null),
        getCashBookReport({ fromDate: fromDate || undefined, toDate: toDate || undefined }),
        getBankReconciliationReport({ companyBankAccountId: accountId || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined }),
        getCashFlowReport(),
        getReceivablesReport({ projectId: projectId || undefined }),
        getPayablesReport({ projectId: projectId || undefined }),
        getOutstandingSummary(),
      ]);
      setBankBook(bb);
      setCashBook(cb);
      setReconciliation(recon);
      setCashFlow(cf);
      setReceivables(recv);
      setPayables(pay);
      setOutstandingSummary(summary);
    } catch {
      setError("Failed to load banking reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accounts.length) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, projectId, fromDate, toDate, accounts.length]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Banking Reports</h1>
          <p className="mt-2 text-slate-500">Bank Book, Cash Book, Reconciliation, Cash Flow, Receivables, Payables, and Outstanding Summary.</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="rounded-lg border p-2.5">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.nickname || a.bankName}</option>)}
            </select>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="rounded-lg border p-2.5">
              <option value="">All Projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label className="whitespace-nowrap text-sm text-slate-500">From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border p-2.5" />
            <label className="whitespace-nowrap text-sm text-slate-500">To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border p-2.5" />
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
          <>
            {tab === "bank-book" && bankBook && (
              <div className="space-y-4 print:hidden-none">
                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                    <div><p className="text-sm text-slate-500">Opening Balance</p><p className="text-lg font-bold">{inr(bankBook.openingBalance)}</p></div>
                    <div><p className="text-sm text-slate-500">Total Deposits</p><p className="text-lg font-bold text-emerald-600">{inr(bankBook.totalDeposits)}</p></div>
                    <div><p className="text-sm text-slate-500">Total Withdrawals</p><p className="text-lg font-bold text-red-600">{inr(bankBook.totalWithdrawals)}</p></div>
                    <div><p className="text-sm text-slate-500">Closing Balance</p><p className="text-lg font-bold">{inr(bankBook.closingBalance)}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => exportBankBookCSV({ companyBankAccountId: accountId, fromDate, toDate })} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"><Download className="h-4 w-4" /> CSV</button>
                    <button onClick={() => exportBankBookPdf({ companyBankAccountId: accountId, fromDate, toDate })} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"><Download className="h-4 w-4" /> PDF</button>
                    <button onClick={() => exportBankBookExcel({ companyBankAccountId: accountId, fromDate, toDate })} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"><FileSpreadsheet className="h-4 w-4" /> Excel</button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"><Printer className="h-4 w-4" /> Print</button>
                    <button onClick={() => setShowEmail("bank-book")} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"><Mail className="h-4 w-4" /> Email</button>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Description</th>
                        <th className="px-4 py-3 text-left">Reference</th>
                        <th className="px-4 py-3 text-right">Deposit</th>
                        <th className="px-4 py-3 text-right">Withdrawal</th>
                        <th className="px-4 py-3 text-right">Balance</th>
                        <th className="px-4 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bankBook.entries.length === 0 ? (
                        <tr><td colSpan={7} className="py-10 text-center text-slate-500">No transactions in this range.</td></tr>
                      ) : (
                        bankBook.entries.map((e) => (
                          <tr key={e.id} className="border-t">
                            <td className="px-4 py-3">{e.transactionDate}</td>
                            <td className="px-4 py-3">{e.description || "—"}</td>
                            <td className="px-4 py-3">{e.referenceNumber || "—"}</td>
                            <td className="px-4 py-3 text-right">{Number(e.deposit) > 0 ? inr(e.deposit) : "—"}</td>
                            <td className="px-4 py-3 text-right">{Number(e.withdrawal) > 0 ? inr(e.withdrawal) : "—"}</td>
                            <td className="px-4 py-3 text-right font-medium">{inr(e.balance)}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${RECONCILIATION_STATUS_COLORS[e.reconciliationStatus]}`}>{RECONCILIATION_STATUS_LABELS[e.reconciliationStatus]}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "cash-book" && cashBook && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                    <div><p className="text-sm text-slate-500">Opening Balance</p><p className="text-lg font-bold">{inr(cashBook.openingBalance)}</p></div>
                    <div><p className="text-sm text-slate-500">Total Received</p><p className="text-lg font-bold text-emerald-600">{inr(cashBook.totalReceived)}</p></div>
                    <div><p className="text-sm text-slate-500">Total Paid</p><p className="text-lg font-bold text-red-600">{inr(cashBook.totalPaid)}</p></div>
                    <div><p className="text-sm text-slate-500">Closing Balance</p><p className="text-lg font-bold">{inr(cashBook.closingBalance)}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => exportCashBookCSV({ fromDate, toDate })} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"><Download className="h-4 w-4" /> CSV</button>
                    <button onClick={() => exportCashBookPdf({ fromDate, toDate })} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"><Download className="h-4 w-4" /> PDF</button>
                    <button onClick={() => exportCashBookExcel({ fromDate, toDate })} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"><FileSpreadsheet className="h-4 w-4" /> Excel</button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"><Printer className="h-4 w-4" /> Print</button>
                    <button onClick={() => setShowEmail("cash-book")} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"><Mail className="h-4 w-4" /> Email</button>
                  </div>
                </div>
                {!cashBook.hasCashAccount && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    No Cash account exists yet — create one from Company Bank Accounts (Account Type = Cash) to set an opening balance.
                  </div>
                )}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Type</th>
                        <th className="px-4 py-3 text-left">Reference</th>
                        <th className="px-4 py-3 text-right">Received</th>
                        <th className="px-4 py-3 text-right">Paid</th>
                        <th className="px-4 py-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashBook.entries.length === 0 ? (
                        <tr><td colSpan={6} className="py-10 text-center text-slate-500">No cash movements in this range.</td></tr>
                      ) : (
                        cashBook.entries.map((e, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-4 py-3">{e.date}</td>
                            <td className="px-4 py-3">{e.type}</td>
                            <td className="px-4 py-3">{e.reference}</td>
                            <td className="px-4 py-3 text-right text-emerald-600">{Number(e.received) > 0 ? inr(e.received) : "—"}</td>
                            <td className="px-4 py-3 text-right text-red-600">{Number(e.paid) > 0 ? inr(e.paid) : "—"}</td>
                            <td className="px-4 py-3 text-right font-medium">{inr(e.balance)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "reconciliation" && reconciliation && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="text-sm text-emerald-700">Matched</p>
                    <p className="text-2xl font-bold text-emerald-700">{reconciliation.summary.matched.count}</p>
                    <p className="text-sm text-emerald-600">{inr(reconciliation.summary.matched.amount)}</p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <p className="text-sm text-amber-700">Partially Matched</p>
                    <p className="text-2xl font-bold text-amber-700">{reconciliation.summary.partiallyMatched.count}</p>
                    <p className="text-sm text-amber-600">{inr(reconciliation.summary.partiallyMatched.amount)}</p>
                  </div>
                  <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                    <p className="text-sm text-red-700">Unmatched</p>
                    <p className="text-2xl font-bold text-red-700">{reconciliation.summary.unmatched.count}</p>
                    <p className="text-sm text-red-600">{inr(reconciliation.summary.unmatched.amount)}</p>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Account</th>
                        <th className="px-4 py-3 text-right">Deposit</th>
                        <th className="px-4 py-3 text-right">Withdrawal</th>
                        <th className="px-4 py-3 text-left">Matched Against</th>
                        <th className="px-4 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reconciliation.transactions.length === 0 ? (
                        <tr><td colSpan={6} className="py-10 text-center text-slate-500">No data.</td></tr>
                      ) : (
                        reconciliation.transactions.map((t) => (
                          <tr key={t.id} className="border-t">
                            <td className="px-4 py-3">{t.transactionDate}</td>
                            <td className="px-4 py-3">{t.companyBankAccount?.nickname || t.companyBankAccount?.bankName}</td>
                            <td className="px-4 py-3 text-right">{Number(t.deposit) > 0 ? inr(t.deposit) : "—"}</td>
                            <td className="px-4 py-3 text-right">{Number(t.withdrawal) > 0 ? inr(t.withdrawal) : "—"}</td>
                            <td className="px-4 py-3 text-slate-500">{t.runningBillPayment ? `RB ${t.runningBillPayment.billNumber}` : t.vendorPayment ? `VB ${t.vendorPayment.billNumber}` : "—"}</td>
                            <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${RECONCILIATION_STATUS_COLORS[t.reconciliationStatus]}`}>{RECONCILIATION_STATUS_LABELS[t.reconciliationStatus]}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "cash-flow" && cashFlow && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {([["Today's Cash", cashFlow.today], ["Weekly Cash", cashFlow.weekly], ["Monthly Cash", cashFlow.monthly]] as const).map(([label, p]) => (
                    <div key={label} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                      <p className="text-sm text-slate-500">{label}</p>
                      <p className={`mt-1 text-2xl font-bold ${Number(p.net) >= 0 ? "text-emerald-600" : "text-red-600"}`}>{inr(p.net)}</p>
                      <div className="mt-3 flex justify-between text-xs text-slate-500">
                        <span>Inflow: {inr(p.inflow)}</span>
                        <span>Outflow: {inr(p.outflow)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
                    <p className="text-sm text-blue-700">Expected Inflow</p>
                    <p className="text-2xl font-bold text-blue-700">{inr(cashFlow.expectedInflow)}</p>
                    <p className="mt-1 text-xs text-blue-600">Outstanding Running Bill receipts</p>
                  </div>
                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-6">
                    <p className="text-sm text-orange-700">Expected Outflow</p>
                    <p className="text-2xl font-bold text-orange-700">{inr(cashFlow.expectedOutflow)}</p>
                    <p className="mt-1 text-xs text-orange-600">Outstanding Vendor Bill payments</p>
                  </div>
                </div>
              </div>
            )}

            {tab === "receivables" && (
              <div className="space-y-4">
                <div className="flex justify-end print:hidden">
                  <button onClick={() => exportReceivablesCSV({ projectId })} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"><Download className="h-4 w-4" /> Export CSV</button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left">Bill #</th>
                        <th className="px-4 py-3 text-left">Project</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Net Payable</th>
                        <th className="px-4 py-3 text-right">Received</th>
                        <th className="px-4 py-3 text-right">Outstanding</th>
                        <th className="px-4 py-3 text-left">Expected Payment</th>
                        <th className="px-4 py-3 text-right">Days Outstanding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receivables.length === 0 ? (
                        <tr><td colSpan={8} className="py-10 text-center text-slate-500">No outstanding Running Bills.</td></tr>
                      ) : (
                        receivables.map((r) => (
                          <tr key={r.id} className="border-t">
                            <td className="px-4 py-3 font-medium">{r.billNumber}</td>
                            <td className="px-4 py-3">{r.project?.name ?? "—"}</td>
                            <td className="px-4 py-3">{r.status}</td>
                            <td className="px-4 py-3 text-right">{inr(r.netPayable)}</td>
                            <td className="px-4 py-3 text-right">{inr(r.amountReceived)}</td>
                            <td className="px-4 py-3 text-right font-medium text-amber-600">{inr(r.outstandingAmount)}</td>
                            <td className="px-4 py-3">{r.expectedPaymentDate}</td>
                            <td className="px-4 py-3 text-right">{r.daysOutstanding}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "payables" && (
              <div className="space-y-4">
                <div className="flex justify-end print:hidden">
                  <button onClick={() => exportPayablesCSV({ projectId })} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"><Download className="h-4 w-4" /> Export CSV</button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left">Bill #</th>
                        <th className="px-4 py-3 text-left">Vendor</th>
                        <th className="px-4 py-3 text-left">Due Date</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-right">Paid</th>
                        <th className="px-4 py-3 text-right">Outstanding</th>
                        <th className="px-4 py-3 text-left">Overdue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payables.length === 0 ? (
                        <tr><td colSpan={7} className="py-10 text-center text-slate-500">No outstanding Vendor Bills.</td></tr>
                      ) : (
                        payables.map((p) => (
                          <tr key={p.id} className="border-t">
                            <td className="px-4 py-3 font-medium">{p.billNumber}</td>
                            <td className="px-4 py-3">{p.vendor?.name ?? "—"}</td>
                            <td className="px-4 py-3">{p.dueDate || "—"}</td>
                            <td className="px-4 py-3 text-right">{inr(p.totalAmount)}</td>
                            <td className="px-4 py-3 text-right">{inr(p.paidAmount)}</td>
                            <td className="px-4 py-3 text-right font-medium text-amber-600">{inr(p.outstandingBalance)}</td>
                            <td className="px-4 py-3">
                              {p.isOverdue ? <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">{p.daysOverdue}d overdue</span> : <span className="text-slate-400">—</span>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "outstanding-summary" && outstandingSummary && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                    <p className="text-sm text-emerald-700">Total Receivable ({outstandingSummary.receivableCount})</p>
                    <p className="text-2xl font-bold text-emerald-700">{inr(outstandingSummary.totalReceivable)}</p>
                  </div>
                  <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                    <p className="text-sm text-red-700">Total Payable ({outstandingSummary.payableCount})</p>
                    <p className="text-2xl font-bold text-red-700">{inr(outstandingSummary.totalPayable)}</p>
                    <p className="mt-1 text-xs text-red-600">{inr(outstandingSummary.overduePayable)} overdue ({outstandingSummary.overduePayableCount})</p>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
                    <p className="text-sm text-blue-700">Net Position</p>
                    <p className={`text-2xl font-bold ${Number(outstandingSummary.netPosition) >= 0 ? "text-blue-700" : "text-red-700"}`}>{inr(outstandingSummary.netPosition)}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-500">Total Cash + Bank Balance</p>
                  <p className="mt-1 text-2xl font-bold">{inr(outstandingSummary.totalCashAndBankBalance)}</p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr><th className="px-4 py-2 text-left">Account</th><th className="px-4 py-2 text-left">Type</th><th className="px-4 py-2 text-right">Balance</th></tr>
                      </thead>
                      <tbody>
                        {outstandingSummary.accountBalances.map((a) => (
                          <tr key={a.id} className="border-t">
                            <td className="px-4 py-2">{a.nickname || a.bankName}</td>
                            <td className="px-4 py-2">{a.accountType}</td>
                            <td className="px-4 py-2 text-right">{inr(a.currentBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showEmail === "bank-book" && bankBook && (
        <EmailReportModal
          title="Bank Book"
          onClose={() => setShowEmail(null)}
          onSend={(recipients, message) => sendBankBookEmail({ companyBankAccountId: accountId, fromDate, toDate }, recipients, message)}
        />
      )}

      {showEmail === "cash-book" && cashBook && (
        <EmailReportModal
          title="Cash Book"
          onClose={() => setShowEmail(null)}
          onSend={(recipients, message) => sendCashBookEmail({ fromDate, toDate }, recipients, message)}
        />
      )}
    </Layout>
  );
}
