import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createBankTransaction, updateBankTransaction, TRANSACTION_CATEGORIES } from "../../services/bank-transactions";
import type { BankTransaction, BankTransactionFormData } from "../../services/bank-transactions";
import type { BankAccountBalance } from "../../services/bank-transactions";
import { getProjects } from "../../services/projects";
import { todayISO } from "../../lib/utils";

interface Props {
  accounts: BankAccountBalance[];
  initialData?: BankTransaction;
  defaultAccountId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function BankTransactionFormModal({ accounts, initialData, defaultAccountId, onClose, onSaved }: Props) {
  const [companyBankAccountId, setCompanyBankAccountId] = useState(initialData?.companyBankAccountId ?? defaultAccountId ?? accounts[0]?.id ?? "");
  const [transactionDate, setTransactionDate] = useState(initialData?.transactionDate ?? todayISO());
  const [direction, setDirection] = useState<"deposit" | "withdrawal">(initialData && Number(initialData.withdrawal) > 0 ? "withdrawal" : "deposit");
  const [amount, setAmount] = useState(initialData ? (Number(initialData.deposit) > 0 ? initialData.deposit : initialData.withdrawal) : "");
  const [referenceNumber, setReferenceNumber] = useState(initialData?.referenceNumber ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "");
  const [projectId, setProjectId] = useState(initialData?.projectId ?? "");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!companyBankAccountId) return setError("Select an account.");
    if (!Number.isFinite(amt) || amt <= 0) return setError("Enter a valid amount.");

    const data: BankTransactionFormData = {
      companyBankAccountId,
      transactionDate,
      deposit: direction === "deposit" ? amt : undefined,
      withdrawal: direction === "withdrawal" ? amt : undefined,
      referenceNumber: referenceNumber || undefined,
      description: description || undefined,
      category: category || undefined,
      projectId: projectId || undefined,
    };

    setSaving(true);
    setError(null);
    try {
      if (initialData) {
        await updateBankTransaction(initialData.id, data);
      } else {
        await createBankTransaction(data);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transaction.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{initialData ? "Edit" : "New"} Bank Transaction</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Account *</label>
            <select value={companyBankAccountId} onChange={(e) => setCompanyBankAccountId(e.target.value)} required className="w-full rounded-lg border p-2.5">
              <option value="">Select account</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.nickname || a.bankName} — {a.accountNumber}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Date *</label>
              <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} required className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Direction *</label>
              <select value={direction} onChange={(e) => setDirection(e.target.value as "deposit" | "withdrawal")} className="w-full rounded-lg border p-2.5">
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Amount *</label>
            <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full rounded-lg border p-2.5" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Reference No.</label>
              <input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <input list="txn-categories" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border p-2.5" />
              <datalist id="txn-categories">
                {TRANSACTION_CATEGORIES.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Project (optional)</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full rounded-lg border p-2.5">
              <option value="">No Project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border p-2.5" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-5 py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Save Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
