import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { recordRunningBillPayment, PAYMENT_MODES } from "../../services/running-bills";
import { getCompanyBankAccounts } from "../../services/company-bank-accounts";
import type { CompanyBankAccount } from "../../services/company-bank-accounts";

interface Props {
  runningBillId: string;
  outstandingAmount: string;
  onClose: () => void;
  onRecorded: () => void;
}

export default function RecordPaymentModal({ runningBillId, outstandingAmount, onClose, onRecorded }: Props) {
  const [amount, setAmount] = useState(outstandingAmount);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState("BANK");
  const [companyBankAccountId, setCompanyBankAccountId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [bankAccounts, setBankAccounts] = useState<CompanyBankAccount[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCompanyBankAccounts().then(setBankAccounts).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return setError("Enter a valid payment amount.");
    if (mode !== "CASH" && !companyBankAccountId) return setError("Select the company bank account the payment landed in.");

    setSaving(true);
    setError(null);
    try {
      await recordRunningBillPayment(runningBillId, {
        amount: amt,
        paymentDate,
        mode,
        companyBankAccountId: mode !== "CASH" ? companyBankAccountId : undefined,
        referenceNumber: referenceNumber || undefined,
        remarks: remarks || undefined,
      });
      onRecorded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Record Payment Received</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-slate-500">Outstanding: <span className="font-semibold text-slate-700">₹{Number(outstandingAmount).toLocaleString("en-IN")}</span></p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Amount *</label>
              <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Payment Date *</label>
              <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Mode *</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full rounded-lg border p-2.5">
                {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Reference / UTR / Cheque No.</label>
              <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} className="w-full rounded-lg border p-2.5" />
            </div>
            {mode !== "CASH" && (
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium">Company Bank Account *</label>
                <select value={companyBankAccountId} onChange={(e) => setCompanyBankAccountId(e.target.value)} required className="w-full rounded-lg border p-2.5">
                  <option value="">Select account</option>
                  {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.bankName} — {a.accountNumber}</option>)}
                </select>
              </div>
            )}
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Remarks</label>
              <textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full rounded-lg border p-2.5" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-5 py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
