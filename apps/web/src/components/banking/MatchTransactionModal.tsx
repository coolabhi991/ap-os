import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getUnmatchedRunningBillPayments, getUnmatchedVendorPayments, matchBankTransaction } from "../../services/bank-transactions";
import type { BankTransaction, UnmatchedPayment } from "../../services/bank-transactions";

interface Props {
  transaction: BankTransaction;
  onClose: () => void;
  onMatched: () => void;
}

export default function MatchTransactionModal({ transaction, onClose, onMatched }: Props) {
  const isDeposit = Number(transaction.deposit) > 0;
  const [candidates, setCandidates] = useState<UnmatchedPayment[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loader = isDeposit ? getUnmatchedRunningBillPayments : getUnmatchedVendorPayments;
    loader(transaction.companyBankAccountId)
      .then(setCandidates)
      .catch(() => setError("Failed to load candidates."))
      .finally(() => setLoading(false));
  }, [isDeposit, transaction.companyBankAccountId]);

  const handleMatch = async () => {
    if (!selectedId) return setError("Select a payment to match against.");
    setSaving(true);
    setError(null);
    try {
      await matchBankTransaction(transaction.id, isDeposit ? { runningBillPaymentId: selectedId } : { vendorPaymentId: selectedId });
      onMatched();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to match transaction.");
    } finally {
      setSaving(false);
    }
  };

  const amount = isDeposit ? transaction.deposit : transaction.withdrawal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Match {isDeposit ? "Deposit" : "Withdrawal"} — ₹{Number(amount).toLocaleString("en-IN")}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <p className="mb-4 text-sm text-slate-500">
          {transaction.transactionDate} — {transaction.description || transaction.referenceNumber || "No description"}
        </p>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <p className="py-8 text-center text-slate-500">Loading candidates...</p>
        ) : candidates.length === 0 ? (
          <p className="py-8 text-center text-slate-500">
            No unmatched {isDeposit ? "Running Bill Payments" : "Vendor Payments"} found on this bank account.
          </p>
        ) : (
          <div className="space-y-2">
            {candidates.map((c) => (
              <label key={c.id} className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 ${selectedId === c.id ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="candidate" checked={selectedId === c.id} onChange={() => setSelectedId(c.id)} />
                  <div>
                    <p className="font-medium">{c.paymentNumber} — {c.billNumber}</p>
                    <p className="text-xs text-slate-500">{c.paymentDate} {c.project ? `· ${c.project}` : ""} {c.vendor ? `· ${c.vendor}` : ""}</p>
                  </div>
                </div>
                <p className="font-semibold">₹{Number(c.amount).toLocaleString("en-IN")}</p>
              </label>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border px-5 py-2.5">Cancel</button>
          <button
            type="button"
            onClick={handleMatch}
            disabled={saving || !selectedId}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Matching..." : "Match"}
          </button>
        </div>
      </div>
    </div>
  );
}
