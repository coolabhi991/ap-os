import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";

import {
  getVendorBankAccounts,
  createVendorBankAccount,
  updateVendorBankAccount,
  deleteVendorBankAccount,
} from "../../services/vendor-bank-accounts";
import type { VendorBankAccount, VendorBankAccountFormData } from "../../services/vendor-bank-accounts";

interface Props {
  vendorId: string;
}

const emptyForm: VendorBankAccountFormData = {
  nickname: "",
  beneficiaryName: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  branch: "",
  upiId: "",
  isPrimary: false,
  isActive: true,
};

function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return `••••${accountNumber.slice(-4)}`;
}

export default function VendorBankAccountsPanel({ vendorId }: Props) {
  const [accounts, setAccounts] = useState<VendorBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<VendorBankAccountFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setAccounts(await getVendorBankAccounts(vendorId));
    } catch {
      setError("Failed to load bank accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const startEdit = (account: VendorBankAccount) => {
    setEditingId(account.id);
    setForm({
      nickname: account.nickname,
      beneficiaryName: account.beneficiaryName,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      ifscCode: account.ifscCode,
      branch: account.branch,
      upiId: account.upiId,
      isPrimary: account.isPrimary,
      isActive: account.isActive,
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bankName.trim() || !form.accountNumber.trim() || !form.ifscCode.trim()) {
      setFormError("Bank name, account number, and IFSC code are required.");
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      if (editingId) {
        await updateVendorBankAccount(editingId, form);
      } else {
        await createVendorBankAccount(vendorId, form);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save bank account.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this bank account?")) return;
    try {
      const result = await deleteVendorBankAccount(id);
      if (!result.deleted) {
        alert(result.message);
      }
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete bank account.");
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold">Bank Accounts</h2>
        <button
          onClick={startAdd}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Add Account
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading...</p>}
      {error && !loading && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {accounts.length === 0 && !showForm && (
            <p className="text-sm text-slate-500">No bank accounts on file for this vendor.</p>
          )}
          {accounts.map((a) => (
            <div key={a.id} className={`rounded-lg border p-4 ${a.isActive ? "border-slate-200" : "border-slate-100 bg-slate-50 opacity-60"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{a.nickname || a.bankName}</p>
                    {a.isPrimary && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <Star size={10} /> Primary
                      </span>
                    )}
                    {!a.isActive && (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500">Inactive</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {a.beneficiaryName && <>{a.beneficiaryName} • </>}
                    {a.bankName} • {maskAccountNumber(a.accountNumber)} • {a.ifscCode}
                  </p>
                  {(a.branch || a.upiId) && (
                    <p className="mt-1 text-xs text-slate-400">
                      {a.branch && <>Branch: {a.branch} </>}
                      {a.upiId && <>• UPI: {a.upiId}</>}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => startEdit(a)}><Pencil size={16} className="text-green-600" /></button>
                  <button onClick={() => handleDelete(a.id)}><Trash2 size={16} className="text-red-600" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-lg border border-slate-200 p-5">
          {formError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Nickname</label>
              <input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="e.g. HDFC Main" className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Beneficiary Name</label>
              <input value={form.beneficiaryName} onChange={(e) => setForm({ ...form, beneficiaryName: e.target.value })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Bank Name *</label>
              <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} required className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Account Number *</label>
              <input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} required className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">IFSC Code *</label>
              <input value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value })} required className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Branch</label>
              <input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">UPI ID</label>
              <input value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} placeholder="vendor@upi" className="w-full rounded-lg border p-2.5" />
            </div>
            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })} />
                Primary Account
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Active
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Save Account"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
