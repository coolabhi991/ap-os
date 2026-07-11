import { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { createAllocations, ALLOCATION_TYPES, ALLOCATION_TYPE_LABELS, SITE_SCOPED_TYPES } from "../../services/transaction-allocations";
import type { AllocationRowInput } from "../../services/transaction-allocations";
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

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

export default function AllocateTransactionModal({ transaction, onClose, onSaved }: Props) {
  const isDeposit = Number(transaction.deposit) > 0;
  const total = Number(isDeposit ? transaction.deposit : transaction.withdrawal);

  const [runningBills, setRunningBills] = useState<RunningBill[]>([]);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>([]);
  const [labourers, setLabourers] = useState<Labour[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [vendorAccountsByBill, setVendorAccountsByBill] = useState<Record<string, VendorBankAccount[]>>({});
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [rows, setRows] = useState<Row[]>([emptyRow(total)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failures, setFailures] = useState<Array<{ index: number; allocationType: string; reason: string }>>([]);

  useEffect(() => {
    Promise.all([
      getRunningBills({ limit: 200 }),
      getVendorBills({ limit: 200 }),
      getLabourList({ status: "Active", limit: 200 }),
      getExpenseCategories(false),
      getAllSites(),
    ])
      .then(([rb, vb, lab, cats, siteList]) => {
        setRunningBills(rb.data.filter((b) => Number(b.outstandingAmount) > 0.01));
        setVendorBills(vb.data.filter((b) => Number(b.outstandingBalance) > 0.01));
        setLabourers(lab.data);
        setCategories(cats);
        setSites(siteList);
      })
      .finally(() => setLoadingOptions(false));
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
      if (result.created.length > 0) {
        onSaved();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save allocations.");
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
                        onChange={(e) => updateRow(row.key, { allocationType: e.target.value, runningBillId: undefined, vendorBillId: undefined, vendorBankAccountId: undefined, labourId: undefined, categoryId: undefined })}
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

                    {SITE_SCOPED_TYPES.includes(row.allocationType) && (
                      <div>
                        <label className="mb-1 block text-xs font-medium">
                          Site {row.allocationType === "SITE_EXPENSE" && "*"}
                        </label>
                        <select value={row.siteId ?? ""} onChange={(e) => updateRow(row.key, { siteId: e.target.value })} className="w-full rounded-lg border p-2 text-sm">
                          <option value="">Select Site</option>
                          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    )}

                    {!["RUNNING_BILL_RECEIPT", "VENDOR_PAYMENT", "LABOUR", "SITE_EXPENSE"].includes(row.allocationType) && (
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
