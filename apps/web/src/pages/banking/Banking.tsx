import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Upload, Download, BarChart3, Pencil, Trash2, Star, ShieldAlert } from "lucide-react";

import Layout from "../../components/layout/Layout";
import BankTransactionFormModal from "../../components/banking/BankTransactionFormModal";
import ImportTransactionsModal from "../../components/banking/ImportTransactionsModal";
import AllocateTransactionModal from "../../components/banking/AllocateTransactionModal";
import ImportedStatementsTab from "../../components/banking/ImportedStatementsTab";
import BankDirectoryTab from "../../components/banking/BankDirectoryTab";
import {
  getBankAccountsWithBalances,
  getBankTransactions,
  deleteBankTransaction,
  exportBankTransactionsCSV,
  ALLOCATION_STATUS_OPTIONS,
  ALLOCATION_STATUS_LABELS,
  ALLOCATION_STATUS_COLORS,
} from "../../services/bank-transactions";
import type { BankAccountBalance, BankTransaction } from "../../services/bank-transactions";
import {
  getCompanyBankAccounts,
  createCompanyBankAccount,
  updateCompanyBankAccount,
  deleteCompanyBankAccount,
  ACCOUNT_TYPE_OPTIONS,
  ACCOUNT_TYPE_LABELS,
} from "../../services/company-bank-accounts";
import type { CompanyBankAccount, CompanyBankAccountFormData } from "../../services/company-bank-accounts";
import LoadingState from "../../components/ui/LoadingState";
import EmptyTableRow from "../../components/ui/EmptyTableRow";

const TABS = [
  { key: "accounts", label: "Accounts" },
  { key: "transactions", label: "All Transactions" },
  { key: "imported-statements", label: "Imported Statements" },
  { key: "directory", label: "Bank Directory" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const emptyAccountForm: CompanyBankAccountFormData = {
  nickname: "",
  beneficiaryName: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  branch: "",
  upiId: "",
  accountType: "BANK",
  openingBalance: 0,
  isPrimary: false,
  isActive: true,
};

function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return `••••${accountNumber.slice(-4)}`;
}

export default function Banking() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("accounts");

  // Accounts tab state
  const [accounts, setAccounts] = useState<CompanyBankAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountForm, setAccountForm] = useState<CompanyBankAccountFormData>(emptyAccountForm);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountFormError, setAccountFormError] = useState<string | null>(null);

  const loadAccounts = async () => {
    setAccountsLoading(true);
    try {
      setAccounts(await getCompanyBankAccounts());
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const startAddAccount = () => {
    setEditingAccountId(null);
    setAccountForm(emptyAccountForm);
    setAccountFormError(null);
    setShowAccountForm(true);
  };

  const startEditAccount = (account: CompanyBankAccount) => {
    setEditingAccountId(account.id);
    setAccountForm({
      nickname: account.nickname,
      beneficiaryName: account.beneficiaryName,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      ifscCode: account.ifscCode,
      branch: account.branch,
      upiId: account.upiId,
      accountType: account.accountType,
      openingBalance: Number(account.openingBalance),
      isPrimary: account.isPrimary,
      isActive: account.isActive,
    });
    setAccountFormError(null);
    setShowAccountForm(true);
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountForm.accountType !== "CASH" && (!accountForm.bankName.trim() || !accountForm.accountNumber.trim() || !accountForm.ifscCode.trim())) {
      setAccountFormError("Bank name, account number, and IFSC code are required.");
      return;
    }
    try {
      setSavingAccount(true);
      setAccountFormError(null);
      if (editingAccountId) await updateCompanyBankAccount(editingAccountId, accountForm);
      else await createCompanyBankAccount(accountForm);
      setShowAccountForm(false);
      await loadAccounts();
    } catch (err) {
      setAccountFormError(err instanceof Error ? err.message : "Failed to save bank account.");
    } finally {
      setSavingAccount(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm("Remove this bank account?")) return;
    try {
      const result = await deleteCompanyBankAccount(id);
      if (!result.deleted) alert(result.message);
      await loadAccounts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete bank account.");
    }
  };

  // Transactions tab state
  const [balances, setBalances] = useState<BankAccountBalance[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [accountFilter, setAccountFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [txnLoading, setTxnLoading] = useState(true);
  const [txnError, setTxnError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTxn, setEditingTxn] = useState<BankTransaction | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [allocatingTxn, setAllocatingTxn] = useState<BankTransaction | null>(null);

  const loadBalances = () => getBankAccountsWithBalances().then(setBalances).catch(() => {});

  useEffect(() => {
    loadBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTransactions = async () => {
    try {
      setTxnLoading(true);
      setTxnError(null);
      const result = await getBankTransactions({
        search: search || undefined,
        companyBankAccountId: accountFilter || undefined,
        allocationStatus: statusFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: 1,
        limit: 100,
      });
      setTransactions(result.data);
      setTotal(result.total);
    } catch {
      setTxnError("Failed to load bank transactions.");
    } finally {
      setTxnLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== "transactions") return;
    loadBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab !== "transactions") return;
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, search, accountFilter, statusFilter, fromDate, toDate]);

  const refreshTransactions = () => {
    loadTransactions();
    loadBalances();
    loadAccounts();
  };

  const handleDeleteTxn = async (t: BankTransaction) => {
    if (t.source === "IMPORTED") {
      alert("Imported bank transactions are read-only and cannot be deleted.");
      return;
    }
    if (!window.confirm("Delete this bank transaction?")) return;
    try {
      await deleteBankTransaction(t.id);
      refreshTransactions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete transaction.");
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportBankTransactionsCSV({ companyBankAccountId: accountFilter || undefined, allocationStatus: statusFilter || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined });
    } catch {
      alert("Failed to export transactions.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Banking</h1>
            <p className="mt-2 text-slate-500">The single financial control center — accounts, statements, and allocations.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/banking/duplicates")} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50">
              <ShieldAlert className="h-4 w-4" /> Duplicate Transactions
            </button>
            <button onClick={() => navigate("/banking/reports")} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50">
              <BarChart3 className="h-4 w-4" /> Reports
            </button>
          </div>
        </div>

        <div className="flex gap-2 rounded-xl bg-white p-2 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t.key ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "accounts" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={startAddAccount} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
                <Plus size={18} /> Add Account
              </button>
            </div>

            {accountsLoading && <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}

            {!accountsLoading && (
              <div className="space-y-3">
                {accounts.length === 0 && !showAccountForm && (
                  <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">No bank accounts on file yet.</div>
                )}
                {accounts.map((a) => (
                  <div key={a.id} className={`rounded-xl border bg-white p-5 shadow-sm ${!a.isActive ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between">
                      <button className="text-left" onClick={() => navigate(`/banking/accounts/${a.id}`)}>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold hover:underline">{a.nickname || a.bankName}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.accountType === "CASH" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                            {ACCOUNT_TYPE_LABELS[a.accountType] ?? a.accountType}
                          </span>
                          {a.isPrimary && (
                            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              <Star size={10} /> Primary
                            </span>
                          )}
                          {!a.isActive && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500">Inactive</span>}
                        </div>
                        {a.accountType === "CASH" ? (
                          <p className="mt-1 text-sm text-slate-500">{a.beneficiaryName || "Cash in Hand"}</p>
                        ) : (
                          <p className="mt-1 text-sm text-slate-500">
                            {a.beneficiaryName && <>{a.beneficiaryName} • </>}
                            {a.bankName} • {maskAccountNumber(a.accountNumber)} • {a.ifscCode}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-slate-400">
                          {(() => {
                            const bal = balances.find((b) => b.id === a.id);
                            return bal ? `Current Balance: ₹${Number(bal.currentBalance).toLocaleString("en-IN")} (from Bank Statement)` : "";
                          })()}
                          {" — click for Statement History"}
                        </p>
                      </button>
                      <div className="flex gap-3">
                        <button onClick={() => startEditAccount(a)}><Pencil size={18} className="text-green-600" /></button>
                        <button onClick={() => handleDeleteAccount(a.id)}><Trash2 size={18} className="text-red-600" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAccountForm && (
              <form onSubmit={handleAccountSubmit} className="space-y-6 rounded-xl bg-white p-8 shadow-sm">
                {accountFormError && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{accountFormError}</div>}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block font-medium">Account Type *</label>
                    <select value={accountForm.accountType} onChange={(e) => setAccountForm({ ...accountForm, accountType: e.target.value })} className="w-full rounded-lg border p-3">
                      {ACCOUNT_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block font-medium">Nickname</label>
                    <input value={accountForm.nickname} onChange={(e) => setAccountForm({ ...accountForm, nickname: e.target.value })} placeholder="e.g. HDFC Current A/C" className="w-full rounded-lg border p-3" />
                  </div>
                  <div>
                    <label className="mb-2 block font-medium">Beneficiary Name</label>
                    <input value={accountForm.beneficiaryName} onChange={(e) => setAccountForm({ ...accountForm, beneficiaryName: e.target.value })} className="w-full rounded-lg border p-3" />
                  </div>
                  {accountForm.accountType !== "CASH" && (
                    <>
                      <div>
                        <label className="mb-2 block font-medium">Bank Name *</label>
                        <input value={accountForm.bankName} onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })} required className="w-full rounded-lg border p-3" />
                      </div>
                      <div>
                        <label className="mb-2 block font-medium">Account Number *</label>
                        <input value={accountForm.accountNumber} onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })} required className="w-full rounded-lg border p-3" />
                      </div>
                      <div>
                        <label className="mb-2 block font-medium">IFSC Code *</label>
                        <input value={accountForm.ifscCode} onChange={(e) => setAccountForm({ ...accountForm, ifscCode: e.target.value })} required className="w-full rounded-lg border p-3" />
                      </div>
                      <div>
                        <label className="mb-2 block font-medium">Branch</label>
                        <input value={accountForm.branch} onChange={(e) => setAccountForm({ ...accountForm, branch: e.target.value })} className="w-full rounded-lg border p-3" />
                      </div>
                      <div>
                        <label className="mb-2 block font-medium">UPI ID</label>
                        <input value={accountForm.upiId} onChange={(e) => setAccountForm({ ...accountForm, upiId: e.target.value })} placeholder="company@upi" className="w-full rounded-lg border p-3" />
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-6 pt-8">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={accountForm.isPrimary} onChange={(e) => setAccountForm({ ...accountForm, isPrimary: e.target.checked })} />
                      Primary Account
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={accountForm.isActive} onChange={(e) => setAccountForm({ ...accountForm, isActive: e.target.checked })} />
                      Active
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                  <button type="button" onClick={() => setShowAccountForm(false)} className="rounded-lg border px-6 py-3">Cancel</button>
                  <button type="submit" disabled={savingAccount} className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60">
                    {savingAccount ? "Saving..." : "Save Account"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {tab === "transactions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-slate-500">{total} transaction{total === 1 ? "" : "s"}</p>
              <div className="flex gap-2">
              <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50 disabled:opacity-60">
                <Download className="h-4 w-4" /> {exporting ? "Exporting..." : "Export CSV"}
              </button>
              <button onClick={() => setShowImport(true)} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50">
                <Upload className="h-4 w-4" /> Upload Statement
              </button>
              <button onClick={() => { setEditingTxn(null); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
                <Plus className="h-4 w-4" /> New Manual Entry
              </button>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reference, description, category..." className="min-w-[220px] flex-1 rounded-lg border p-2.5" />
                <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="rounded-lg border p-2.5">
                  <option value="">All Accounts</option>
                  {balances.map((a) => <option key={a.id} value={a.id}>{a.nickname || a.bankName}</option>)}
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border p-2.5">
                  <option value="">All Statuses</option>
                  {ALLOCATION_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{ALLOCATION_STATUS_LABELS[s]}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-500">From</label>
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border p-2.5" />
                  <label className="text-sm text-slate-500">To</label>
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border p-2.5" />
                </div>
              </div>
            </div>

            {txnLoading && <LoadingState />}
            {txnError && !txnLoading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{txnError}</div>}

            {!txnLoading && !txnError && (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Account</th>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-left">Source</th>
                      <th className="px-4 py-3 text-right">Deposit</th>
                      <th className="px-4 py-3 text-right">Withdrawal</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <EmptyTableRow colSpan={8}>No bank transactions recorded yet.</EmptyTableRow>
                    ) : (
                      transactions.map((t) => (
                        <tr key={t.id} className="border-t hover:bg-slate-50">
                          <td className="px-4 py-3">{t.transactionDate}</td>
                          <td className="px-4 py-3">{t.companyBankAccount?.nickname || t.companyBankAccount?.bankName}</td>
                          <td className="px-4 py-3">{t.description || "—"}</td>
                          <td className="px-4 py-3 text-slate-500">{t.source === "IMPORTED" ? "Statement" : "Manual"}</td>
                          <td className="px-4 py-3 text-right">{Number(t.deposit) > 0 ? `₹${Number(t.deposit).toLocaleString("en-IN")}` : "—"}</td>
                          <td className="px-4 py-3 text-right">{Number(t.withdrawal) > 0 ? `₹${Number(t.withdrawal).toLocaleString("en-IN")}` : "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ALLOCATION_STATUS_COLORS[t.allocationStatus]}`}>
                              {ALLOCATION_STATUS_LABELS[t.allocationStatus] ?? t.allocationStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button onClick={() => setAllocatingTxn(t)} className="text-sm text-blue-600 hover:underline">Allocate</button>
                              {t.source === "MANUAL" && (
                                <>
                                  <button onClick={() => { setEditingTxn(t); setShowForm(true); }} className="text-sm text-slate-600 hover:underline">Edit</button>
                                  <button onClick={() => handleDeleteTxn(t)} className="text-sm text-red-600 hover:underline">Delete</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "imported-statements" && <ImportedStatementsTab accounts={balances} />}

        {tab === "directory" && <BankDirectoryTab />}
      </div>

      {showForm && (
        <BankTransactionFormModal
          accounts={balances}
          initialData={editingTxn ?? undefined}
          defaultAccountId={accountFilter || undefined}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refreshTransactions(); }}
        />
      )}

      {showImport && (
        <ImportTransactionsModal accounts={balances} onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); refreshTransactions(); }} />
      )}

      {allocatingTxn && (
        <AllocateTransactionModal transaction={allocatingTxn} onClose={() => setAllocatingTxn(null)} onSaved={() => { setAllocatingTxn(null); refreshTransactions(); }} />
      )}
    </Layout>
  );
}
