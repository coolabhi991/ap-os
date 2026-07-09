import { useEffect, useMemo, useState } from "react";
import type { ExpenseFormData } from "../../services/expenses";
import {
  PAYMENT_MODE_OPTIONS,
  PAYMENT_MODE_LABELS,
  MACHINE_TYPE_OPTIONS,
  MACHINE_TYPE_LABELS,
  isMachineryCategory,
} from "../../services/expenses";
import type { CompanyBankAccount } from "../../services/company-bank-accounts";

interface Option {
  id: string;
  name: string;
}

interface Props {
  initialData?: Partial<ExpenseFormData>;
  onSubmit: (data: ExpenseFormData) => void;
  saving?: boolean;
  projects: Option[];
  categories: Option[];
  vendors: Option[];
  companyBankAccounts: CompanyBankAccount[];
}

export default function ExpenseForm({
  initialData,
  onSubmit,
  saving = false,
  projects,
  categories,
  vendors,
  companyBankAccounts,
}: Props) {
  const [form, setForm] = useState<ExpenseFormData>({
    projectId: initialData?.projectId ?? "",
    categoryId: initialData?.categoryId ?? "",
    vendorId: initialData?.vendorId ?? "",
    expenseDate: initialData?.expenseDate ?? new Date().toISOString().slice(0, 10),
    description: initialData?.description ?? "",
    amount: initialData?.amount ?? 0,
    paymentMode: initialData?.paymentMode ?? "",
    companyBankAccountId: initialData?.companyBankAccountId ?? "",
    attachmentFileName: initialData?.attachmentFileName ?? "",
    attachmentFileUrl: initialData?.attachmentFileUrl ?? "",
    remarks: initialData?.remarks ?? "",
    machineType: initialData?.machineType ?? "",
    machineHours: initialData?.machineHours ?? 0,
    machineRatePerHour: initialData?.machineRatePerHour ?? 0,
  });
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ExpenseFormData>(key: K, value: ExpenseFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isCompanyBank = form.paymentMode === "COMPANY_BANK";
  const isVendorCredit = form.paymentMode === "VENDOR_CREDIT";
  const selectedCategoryName = useMemo(() => categories.find((c) => c.id === form.categoryId)?.name, [categories, form.categoryId]);
  const isMachinery = isMachineryCategory(selectedCategoryName);

  // Total Amount is always auto-calculated from Hours × Rate Per Hour for Machinery expenses.
  useEffect(() => {
    if (isMachinery) {
      set("amount", Math.round(form.machineHours * form.machineRatePerHour * 100) / 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMachinery, form.machineHours, form.machineRatePerHour]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId) return setError("Select a project.");
    if (!form.categoryId) return setError("Select a category.");
    if (!form.paymentMode) return setError("Select a payment mode.");
    if (isCompanyBank && !form.companyBankAccountId) return setError("Select the company bank account this expense was paid from.");
    if (isVendorCredit && !form.vendorId) return setError("Vendor is required for Vendor Credit expenses.");
    if (isMachinery) {
      if (!form.machineType) return setError("Select a machine type.");
      if (!form.machineHours || form.machineHours <= 0) return setError("Enter hours greater than zero.");
      if (!form.machineRatePerHour || form.machineRatePerHour <= 0) return setError("Enter a rate per hour greater than zero.");
    } else if (!form.amount || form.amount <= 0) {
      return setError("Enter an amount greater than zero.");
    }
    setError(null);
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-xl bg-white p-8 shadow-sm">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Expense Details</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Project *</label>
            <select value={form.projectId} onChange={(e) => set("projectId", e.target.value)} required className="w-full rounded-lg border p-3">
              <option value="">Select Project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Category *</label>
            <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} required className="w-full rounded-lg border p-3">
              <option value="">Select Category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {categories.length === 0 && (
              <p className="mt-1 text-sm text-amber-600">No expense categories yet — add one under Manage Categories.</p>
            )}
          </div>

          <div>
            <label className="mb-2 block font-medium">Date</label>
            <input type="date" value={form.expenseDate} onChange={(e) => set("expenseDate", e.target.value)} className="w-full rounded-lg border p-3" />
          </div>

          {!isMachinery && (
            <div>
              <label className="mb-2 block font-medium">Amount *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => set("amount", parseFloat(e.target.value) || 0)}
                required
                className="w-full rounded-lg border p-3"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block font-medium">
              Vendor {isVendorCredit && <span className="text-red-500">*</span>}
              {!isVendorCredit && <span className="font-normal text-slate-400"> (optional)</span>}
            </label>
            <select value={form.vendorId} onChange={(e) => set("vendorId", e.target.value)} required={isVendorCredit} className="w-full rounded-lg border p-3">
              <option value="">{isVendorCredit ? "Select Vendor" : "No Vendor"}</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          {isMachinery && (
            <>
              <div>
                <label className="mb-2 block font-medium">Machine Type *</label>
                <select value={form.machineType} onChange={(e) => set("machineType", e.target.value)} required className="w-full rounded-lg border p-3">
                  <option value="">Select Machine Type</option>
                  {MACHINE_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{MACHINE_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-medium">Hours *</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.machineHours}
                  onChange={(e) => set("machineHours", parseFloat(e.target.value) || 0)}
                  required
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">Rate Per Hour *</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.machineRatePerHour}
                  onChange={(e) => set("machineRatePerHour", parseFloat(e.target.value) || 0)}
                  required
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">Total Amount (auto-calculated)</label>
                <input type="text" value={form.amount.toFixed(2)} readOnly disabled className="w-full rounded-lg border bg-slate-50 p-3 text-slate-600" />
              </div>
            </>
          )}

          <div>
            <label className="mb-2 block font-medium">Payment Mode *</label>
            <select value={form.paymentMode} onChange={(e) => set("paymentMode", e.target.value)} required className="w-full rounded-lg border p-3">
              <option value="">Select Mode</option>
              {PAYMENT_MODE_OPTIONS.map((m) => (
                <option key={m} value={m}>{PAYMENT_MODE_LABELS[m]}</option>
              ))}
            </select>
          </div>

          {isCompanyBank && (
            <div>
              <label className="mb-2 block font-medium">Company Bank Account *</label>
              <select value={form.companyBankAccountId} onChange={(e) => set("companyBankAccountId", e.target.value)} required className="w-full rounded-lg border p-3">
                <option value="">Select Account</option>
                {companyBankAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.nickname || a.bankName} — {a.bankName} (••••{a.accountNumber.slice(-4)})</option>
                ))}
              </select>
              {companyBankAccounts.length === 0 && (
                <p className="mt-1 text-sm text-amber-600">No company bank accounts on file.</p>
              )}
            </div>
          )}

          {isVendorCredit && (
            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700 md:col-span-2">
              This expense will be recorded as an outstanding credit owed to the vendor. No payment is created automatically —
              settle it later through a Vendor Bill / Vendor Payment when reconciled.
            </div>
          )}

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Description</label>
            <input type="text" value={form.description} onChange={(e) => set("description", e.target.value)} className="w-full rounded-lg border p-3" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Attachment &amp; Remarks</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Attachment File Name</label>
            <input
              type="text"
              value={form.attachmentFileName}
              onChange={(e) => set("attachmentFileName", e.target.value)}
              placeholder="e.g. receipt.jpg"
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div>
            <label className="mb-2 block font-medium">Attachment File URL</label>
            <input
              type="text"
              value={form.attachmentFileUrl}
              onChange={(e) => set("attachmentFileUrl", e.target.value)}
              placeholder="Uploaded file URL (once storage is wired up)"
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Remarks</label>
            <textarea rows={3} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} className="w-full rounded-lg border p-3" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" className="rounded-lg border px-6 py-3">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? "Saving..." : "Save Expense"}
        </button>
      </div>
    </form>
  );
}
