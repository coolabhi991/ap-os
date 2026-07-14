import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { X, Plus, Trash2, AlertTriangle, ExternalLink } from "lucide-react";
import {
  createAllocations,
  getAllocationsForTransaction,
  deleteAllocation,
  ALLOCATION_TYPES,
  ALLOCATION_TYPE_LABELS,
  SITE_SCOPED_TYPES,
  SITE_REQUIRED_TYPES,
  PARTNER_SCOPED_TYPES,
  EMPLOYEE_SCOPED_TYPES,
  LOAN_REPAYMENT_TYPES,
  LOAN_TYPE_TO_LIABILITY_TYPE,
  LEDGER_BACKED_TYPES,
} from "../../services/transaction-allocations";
import type { AllocationRowInput, TransactionAllocation } from "../../services/transaction-allocations";
import { getEmployees } from "../../services/employees";
import type { Employee } from "../../services/employees";
import type { BankTransaction } from "../../services/bank-transactions";
import { getRunningBills } from "../../services/running-bills";
import type { RunningBill } from "../../services/running-bills";
import { getVendorBills } from "../../services/vendor-bills";
import type { VendorBill } from "../../services/vendor-bills";
import { getVendorBankAccounts } from "../../services/vendor-bank-accounts";
import type { VendorBankAccount } from "../../services/vendor-bank-accounts";
import { getLabourList } from "../../services/labour";
import type { Labour } from "../../services/labour";
import { getExpenseCategories } from "../../services/expense-categories";
import type { ExpenseCategory } from "../../services/expense-categories";
import { getAllSites } from "../../services/sites";
import type { Site } from "../../services/sites";
import { getPartners } from "../../services/partners";
import type { Partner } from "../../services/partners";
import { getLiabilities } from "../../services/liabilities";
import type { Liability } from "../../services/liabilities";
import { getCompanyBankAccounts } from "../../services/company-bank-accounts";
import type { CompanyBankAccount } from "../../services/company-bank-accounts";
import { formatCurrency as inr } from "../../lib/utils";

interface Props {
  transaction: BankTransaction;
  onClose: () => void;
  onSaved: () => void;
}

interface Row extends AllocationRowInput {
  key: number;
}

let rowKeySeq = 0;
const emptyRow = (amount: number): Row => ({ key: ++rowKeySeq, allocationType: "OTHER", amount });

/**
 * The backend rejects a bad allocation with a specific, actionable message (e.g. "Allocations
 * (...) exceed the remaining unallocated balance (...) on this transaction") in the JSON error
 * body — but Axios's own `error.message` for a failed request is just the generic
 * "Request failed with status code 400", since there's no global response interceptor unwrapping
 * this. Prefer the real backend message; only fall back to the generic text if the response
 * genuinely carries no message (e.g. a network error).
 */
function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const backendMessage = (err.response?.data as { message?: string } | undefined)?.message;
    if (backendMessage) return backendMessage;
  }
  return err instanceof Error ? err.message : fallback;
}

/**
 * Banking Integration two-way traceability — every allocation that created a real business record
 * must be able to open it (Bank Transaction -> Open Expense/Vendor Payment/etc.). Vendor Payment
 * and Expense have their own per-record view route; the rest (Labour, Partner Investment/
 * Settlement, Liability, Liability Repayment/Credit Card Bill Payment) only have list/tab-based
 * pages today, so those link to the owning list/tab rather than a non-existent per-record route.
 */
function linkedRecordRoute(a: TransactionAllocation): { label: string; to: string } | null {
  if (a.expense) return { label: "Open Expense", to: `/expenses/${a.expense.id}` };
  if (a.vendorPayment) return { label: "Open Vendor Payment", to: `/vendor-payments/${a.vendorPayment.id}` };
  if (a.runningBillPayment) return { label: "Open Running Bill", to: `/running-bills/${a.runningBillPayment.runningBillId}` };
  if (a.labourPayment) return { label: "Open Labour Payment", to: "/labour/payments" };
  if (a.partnerInvestment) return { label: "Open Partner Investment", to: "/partnership?tab=investments" };
  if (a.partnerSettlement) return { label: "Open Partner Settlement", to: "/partnership?tab=settlements" };
  if (a.liabilityRepayment) {
    return {
      label: a.allocationType === "CREDIT_CARD_BILL_PAYMENT" ? "Open Credit Card Payment" : "Open Liability Repayment",
      to: "/finance?tab=repayment-history",
    };
  }
  if (a.liability) return { label: "Open Liability", to: "/finance?tab=liabilities" };
  return null;
}


export default function AllocateTransactionModal({ transaction, onClose, onSaved }: Props) {
  const navigate = useNavigate();
  const isDeposit = Number(transaction.deposit) > 0;
  const total = Number(isDeposit ? transaction.deposit : transaction.withdrawal);

  const [runningBills, setRunningBills] = useState<RunningBill[]>([]);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>([]);
  const [labourers, setLabourers] = useState<Labour[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bankAccounts, setBankAccounts] = useState<CompanyBankAccount[]>([]);
  const [vendorAccountsByBill, setVendorAccountsByBill] = useState<Record<string, VendorBankAccount[]>>({});
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [rows, setRows] = useState<Row[]>([emptyRow(total)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failures, setFailures] = useState<Array<{ index: number; allocationType: string; reason: string }>>([]);

  const [existingAllocations, setExistingAllocations] = useState<TransactionAllocation[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const loadExisting = () => {
    setLoadingExisting(true);
    getAllocationsForTransaction(transaction.id)
      .then((data) => {
        setExistingAllocations(data);
        const alreadyAllocated = data.reduce((s, a) => s + Number(a.amount), 0);
        const remainingNow = Math.max(0, total - alreadyAllocated);
        setRows([emptyRow(remainingNow)]);
      })
      .catch(() => setExistingAllocations([]))
      .finally(() => setLoadingExisting(false));
  };

  useEffect(() => {
    loadExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction.id]);

  const handleRemoveExisting = async (id: string, ledgerBacked: boolean, confirmed: boolean) => {
    if (ledgerBacked) return;
    try {
      await deleteAllocation(id, confirmed);
      setConfirmingDeleteId(null);
      loadExisting();
    } catch (err) {
      alert(extractErrorMessage(err, "Failed to remove allocation."));
    }
  };

  useEffect(() => {
    Promise.all([
      getRunningBills({ limit: 200 }),
      getVendorBills({ limit: 200 }),
      getLabourList({ status: "Active", limit: 200 }),
      getExpenseCategories(false),
      getAllSites(),
      getPartners({ isActive: true }),
      getLiabilities({ status: "ACTIVE" }),
      getEmployees({ status: "ACTIVE", limit: 200 }),
      getCompanyBankAccounts(),
    ])
      .then(([rb, vb, lab, cats, siteList, partnerList, liabilityList, employeeList, accountList]) => {
        setRunningBills(rb.data.filter((b) => Number(b.outstandingAmount) > 0.01));
        setVendorBills(vb.data.filter((b) => Number(b.outstandingBalance) > 0.01));
        setLabourers(lab.data);
        setCategories(cats);
        setSites(siteList);
        setPartners(partnerList.data);
        setLiabilities(liabilityList.data);
        setEmployees(employeeList.data);
        setBankAccounts(accountList.filter((a) => a.isActive && a.id !== transaction.companyBankAccountId));
      })
      .finally(() => setLoadingOptions(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadVendorAccounts = async (billId: string, vendorId: string) => {
    if (vendorAccountsByBill[billId]) return;
    const accounts = await getVendorBankAccounts(vendorId).catch(() => []);
    setVendorAccountsByBill((prev) => ({ ...prev, [billId]: accounts }));
  };

  const updateRow = (key: number, patch: Partial<Row>) => setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  const addRow = () => setRows((r) => [...r, emptyRow(0)]);
  const removeRow = (key: number) => setRows((r) => (r.length > 1 ? r.filter((row) => row.key !== key) : r));

  const allocatedSoFar = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const remaining = total - allocatedSoFar;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFailures([]);
    if (allocatedSoFar > total + 0.01) {
      setError(`Allocations (${inr(allocatedSoFar)}) exceed the transaction amount (${inr(total)}).`);
      return;
    }
    setSaving(true);
    try {
      const payload: AllocationRowInput[] = rows.map(({ key: _key, ...rest }) => rest);
      const result = await createAllocations(transaction.id, payload);
      if (result.failed.length > 0) {
        setFailures(result.failed);
      }
      if (result.transferSuggestions?.length > 0) {
        const count = result.transferSuggestions.reduce((s, t) => s + t.candidates.length, 0);
        alert(
          `Found ${count} possible matching transaction${count === 1 ? "" : "s"} on the destination account (same amount, unallocated, within 10 days) — ` +
          `open that account's statement and allocate it as Internal Transfer too to complete both sides.`
        );
      }
      if (result.created.length > 0) {
        onSaved();
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to save allocations."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            Allocate {isDeposit ? "Deposit" : "Withdrawal"} — {inr(total)}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <p className="mb-4 text-sm text-slate-500">
          {transaction.transactionDate} — {transaction.description || transaction.referenceNumber || "No description"}
        </p>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {!loadingExisting && existingAllocations.length > 0 && (
          <div className="mb-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Existing Allocations</p>
            {existingAllocations.map((a) => {
              const ledgerBacked = LEDGER_BACKED_TYPES.includes(a.allocationType);
              const linked = linkedRecordRoute(a);
              return (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <span>
                    {ALLOCATION_TYPE_LABELS[a.allocationType] ?? a.allocationType} — {inr(Number(a.amount))}
                    {a.partyName && <span className="text-slate-400"> ({a.partyName})</span>}
                    {a.transferToAccount && (
                      <span className="text-slate-400"> (to {a.transferToAccount.nickname || a.transferToAccount.bankName})</span>
                    )}
                    {linked && (
                      <button
                        type="button"
                        onClick={() => { onClose(); navigate(linked.to); }}
                        className="ml-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        {linked.label} <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                  {confirmingDeleteId === a.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-700">Remove this allocation?</span>
                      <button type="button" onClick={() => handleRemoveExisting(a.id, false, true)} className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700">
                        Confirm
                      </button>
                      <button type="button" onClick={() => setConfirmingDeleteId(null)} className="rounded border px-2 py-1 text-xs">Cancel</button>
                    </div>
                  ) : ledgerBacked ? (
                    <span className="flex items-center gap-1 text-xs text-amber-600" title="Created a real record — remove it from its own module first">
                      <AlertTriangle className="h-3.5 w-3.5" /> Protected
                    </span>
                  ) : (
                    <button type="button" onClick={() => setConfirmingDeleteId(a.id)} className="rounded p-1 text-red-600 hover:bg-red-50" title="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {failures.length > 0 && (
          <div className="mb-4 space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {failures.map((f, i) => (
              <p key={i}>Row {f.index + 1} ({ALLOCATION_TYPE_LABELS[f.allocationType] ?? f.allocationType}): {f.reason}</p>
            ))}
          </div>
        )}

        {loadingOptions ? (
          <p className="py-8 text-center text-slate-500">Loading options...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              {rows.map((row, idx) => (
                <div key={row.key} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">Row {idx + 1}</p>
                    {rows.length > 1 && (
                      <button type="button" onClick={() => removeRow(row.key)} className="rounded p-1 text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="mt-2 grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium">Type *</label>
                      <select
                        value={row.allocationType}
                        onChange={(e) => updateRow(row.key, { allocationType: e.target.value, runningBillId: undefined, vendorBillId: undefined, vendorBankAccountId: undefined, labourId: undefined, categoryId: undefined, partnerId: undefined, liabilityId: undefined, principalPaid: undefined, interestPaid: undefined, employeeId: undefined, transferAccountId: undefined })}
                        className="w-full rounded-lg border p-2 text-sm"
                      >
                        {ALLOCATION_TYPES.map((t) => <option key={t} value={t}>{ALLOCATION_TYPE_LABELS[t]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Amount *</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.amount}
                        onChange={(e) => updateRow(row.key, { amount: Number(e.target.value) || 0 })}
                        className="w-full rounded-lg border p-2 text-sm"
                      />
                    </div>

                    {row.allocationType === "RUNNING_BILL_RECEIPT" && (
                      <div>
                        <label className="mb-1 block text-xs font-medium">Running Bill *</label>
                        <select value={row.runningBillId ?? ""} onChange={(e) => updateRow(row.key, { runningBillId: e.target.value })} className="w-full rounded-lg border p-2 text-sm">
                          <option value="">Select Bill</option>
                          {runningBills.map((b) => <option key={b.id} value={b.id}>{b.billNumber} — {inr(b.outstandingAmount)} due</option>)}
                        </select>
                      </div>
                    )}

                    {row.allocationType === "VENDOR_PAYMENT" && (
                      <>
                        <div>
                          <label className="mb-1 block text-xs font-medium">Vendor Bill *</label>
                          <select
                            value={row.vendorBillId ?? ""}
                            onChange={(e) => {
                              const bill = vendorBills.find((b) => b.id === e.target.value);
                              updateRow(row.key, { vendorBillId: e.target.value, vendorBankAccountId: undefined });
                              if (bill) loadVendorAccounts(bill.id, bill.vendorId);
                            }}
                            className="w-full rounded-lg border p-2 text-sm"
                          >
                            <option value="">Select Bill</option>
                            {vendorBills.map((b) => <option key={b.id} value={b.id}>{b.billNumber} — {b.vendor?.name} — {inr(b.outstandingBalance)} due</option>)}
                          </select>
                        </div>
                        {row.vendorBillId && (
                          <div>
                            <label className="mb-1 block text-xs font-medium">Vendor Bank Account *</label>
                            <select value={row.vendorBankAccountId ?? ""} onChange={(e) => updateRow(row.key, { vendorBankAccountId: e.target.value })} className="w-full rounded-lg border p-2 text-sm">
                              <option value="">Select Account</option>
                              {(vendorAccountsByBill[row.vendorBillId] ?? []).map((a) => (
                                <option key={a.id} value={a.id}>{a.nickname || a.bankName} (••••{a.accountNumber.slice(-4)})</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}

                    {row.allocationType === "LABOUR" && (
                      <div>
                        <label className="mb-1 block text-xs font-medium">Worker *</label>
                        <select value={row.labourId ?? ""} onChange={(e) => updateRow(row.key, { labourId: e.target.value })} className="w-full rounded-lg border p-2 text-sm">
                          <option value="">Select Worker</option>
                          {labourers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      </div>
                    )}

                    {row.allocationType === "SITE_EXPENSE" && (
                      <div>
                        <label className="mb-1 block text-xs font-medium">Category *</label>
                        <select value={row.categoryId ?? ""} onChange={(e) => updateRow(row.key, { categoryId: e.target.value })} className="w-full rounded-lg border p-2 text-sm">
                          <option value="">Select Category</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}

                    {(row.allocationType === "OWNER_INVESTMENT" || row.allocationType === "PARTNER_INVESTMENT" || row.allocationType === "PARTNER_SETTLEMENT") && (
                      <div>
                        <label className="mb-1 block text-xs font-medium">Partner *</label>
                        <select value={row.partnerId ?? ""} onChange={(e) => updateRow(row.key, { partnerId: e.target.value })} className="w-full rounded-lg border p-2 text-sm">
                          <option value="">Select Partner</option>
                          {partners
                            .filter((p) =>
                              row.allocationType === "OWNER_INVESTMENT"
                                ? p.partnerType === "OWNER"
                                : row.allocationType === "PARTNER_INVESTMENT"
                                  ? p.partnerType === "PARTNER"
                                  : true
                            )
                            .map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    )}

                    {row.allocationType === "LIABILITY_DISBURSEMENT" && (
                      <div>
                        <label className="mb-1 block text-xs font-medium">Liability *</label>
                        <select value={row.liabilityId ?? ""} onChange={(e) => updateRow(row.key, { liabilityId: e.target.value })} className="w-full rounded-lg border p-2 text-sm">
                          <option value="">Select Liability</option>
                          {liabilities.map((l) => <option key={l.id} value={l.id}>{l.loanName}</option>)}
                        </select>
                      </div>
                    )}

                    {LOAN_REPAYMENT_TYPES.includes(row.allocationType) && (
                      <>
                        <div>
                          <label className="mb-1 block text-xs font-medium">Liability *</label>
                          <select value={row.liabilityId ?? ""} onChange={(e) => updateRow(row.key, { liabilityId: e.target.value })} className="w-full rounded-lg border p-2 text-sm">
                            <option value="">Select Liability</option>
                            {liabilities
                              .filter((l) => {
                                const matchType = LOAN_TYPE_TO_LIABILITY_TYPE[row.allocationType];
                                return !matchType || l.liabilityType === matchType;
                              })
                              .map((l) => <option key={l.id} value={l.id}>{l.loanName} — {inr(l.outstandingAmount)} outstanding</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium">Principal Paid *</label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.principalPaid ?? ""}
                            onChange={(e) => updateRow(row.key, { principalPaid: Number(e.target.value) || 0 })}
                            className="w-full rounded-lg border p-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium">Interest Paid *</label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.interestPaid ?? ""}
                            onChange={(e) => updateRow(row.key, { interestPaid: Number(e.target.value) || 0 })}
                            className="w-full rounded-lg border p-2 text-sm"
                          />
                        </div>
                        {Math.abs((Number(row.principalPaid) || 0) + (Number(row.interestPaid) || 0) - row.amount) > 0.01 && (
                          <p className="md:col-span-3 text-xs text-amber-600">Principal Paid + Interest Paid must equal the Amount (₹{row.amount}).</p>
                        )}
                      </>
                    )}

                    {row.allocationType === "INTERNAL_TRANSFER" && (
                      <div>
                        <label className="mb-1 block text-xs font-medium">Transfer To Account *</label>
                        <select value={row.transferAccountId ?? ""} onChange={(e) => updateRow(row.key, { transferAccountId: e.target.value })} className="w-full rounded-lg border p-2 text-sm">
                          <option value="">Select Account</option>
                          {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.nickname || a.bankName}</option>)}
                        </select>
                      </div>
                    )}

                    {SITE_SCOPED_TYPES.includes(row.allocationType) && (
                      <div>
                        <label className="mb-1 block text-xs font-medium">
                          Site {SITE_REQUIRED_TYPES.includes(row.allocationType) && "*"}
                        </label>
                        <select value={row.siteId ?? ""} onChange={(e) => updateRow(row.key, { siteId: e.target.value })} className="w-full rounded-lg border p-2 text-sm">
                          <option value="">Select Site</option>
                          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    )}

                    {EMPLOYEE_SCOPED_TYPES.includes(row.allocationType) && (
                      <div>
                        <label className="mb-1 block text-xs font-medium">Employee *</label>
                        <select value={row.employeeId ?? ""} onChange={(e) => updateRow(row.key, { employeeId: e.target.value })} className="w-full rounded-lg border p-2 text-sm">
                          <option value="">Select Employee</option>
                          {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                      </div>
                    )}

                    {![
                      "RUNNING_BILL_RECEIPT",
                      "VENDOR_PAYMENT",
                      "LABOUR",
                      "SITE_EXPENSE",
                      "LIABILITY_DISBURSEMENT",
                      "INTERNAL_TRANSFER",
                      ...LOAN_REPAYMENT_TYPES,
                      ...PARTNER_SCOPED_TYPES,
                      ...EMPLOYEE_SCOPED_TYPES,
                    ].includes(row.allocationType) && (
                      <div>
                        <label className="mb-1 block text-xs font-medium">Party Name</label>
                        <input value={row.partyName ?? ""} onChange={(e) => updateRow(row.key, { partyName: e.target.value })} className="w-full rounded-lg border p-2 text-sm" />
                      </div>
                    )}

                    <div className="md:col-span-3">
                      <label className="mb-1 block text-xs font-medium">Notes</label>
                      <input value={row.notes ?? ""} onChange={(e) => updateRow(row.key, { notes: e.target.value })} className="w-full rounded-lg border p-2 text-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addRow} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
              <Plus className="h-4 w-4" /> Split Into Another Allocation
            </button>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <span>Allocated: <strong>{inr(allocatedSoFar)}</strong> of {inr(total)}</span>
              <span className={remaining < -0.01 ? "text-red-600" : "text-slate-500"}>Remaining: {inr(remaining)}</span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-lg border px-5 py-2.5">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60">
                {saving ? "Saving..." : "Save Allocation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
