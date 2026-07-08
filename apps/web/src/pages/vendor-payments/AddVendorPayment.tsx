import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import { getVendorBills } from "../../services/vendor-bills";
import type { VendorBill } from "../../services/vendor-bills";
import { recordVendorPayment, PAYMENT_MODE_OPTIONS, PAYMENT_MODE_LABELS } from "../../services/vendor-payments";
import { getCompanyBankAccounts } from "../../services/company-bank-accounts";
import type { CompanyBankAccount } from "../../services/company-bank-accounts";
import { getVendorBankAccounts } from "../../services/vendor-bank-accounts";
import type { VendorBankAccount } from "../../services/vendor-bank-accounts";

export default function AddVendorPayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedBillId = searchParams.get("billId") ?? "";

  const [bills, setBills] = useState<VendorBill[]>([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [vendorBillId, setVendorBillId] = useState(preselectedBillId);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState("");

  const [companyAccounts, setCompanyAccounts] = useState<CompanyBankAccount[]>([]);
  const [companyBankAccountId, setCompanyBankAccountId] = useState("");
  const [vendorAccounts, setVendorAccounts] = useState<VendorBankAccount[]>([]);
  const [vendorBankAccountId, setVendorBankAccountId] = useState("");
  const [loadingVendorAccounts, setLoadingVendorAccounts] = useState(false);

  const [referenceNumber, setReferenceNumber] = useState("");
  const [attachmentFileName, setAttachmentFileName] = useState("");
  const [attachmentFileUrl, setAttachmentFileUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVendorBills({ limit: 200 })
      .then((r) => setBills(r.data.filter((b) => Number(b.outstandingBalance) > 0)))
      .catch(() => {})
      .finally(() => setLoadingBills(false));
    getCompanyBankAccounts()
      .then((accounts) => {
        setCompanyAccounts(accounts.filter((a) => a.isActive));
        const primary = accounts.find((a) => a.isPrimary && a.isActive);
        if (primary) setCompanyBankAccountId(primary.id);
      })
      .catch(() => {});
  }, []);

  const selectedBill = useMemo(() => bills.find((b) => b.id === vendorBillId) ?? null, [bills, vendorBillId]);
  const isCash = mode === "CASH";

  useEffect(() => {
    setVendorBankAccountId("");
    setVendorAccounts([]);
    if (!selectedBill?.vendorId) return;
    setLoadingVendorAccounts(true);
    getVendorBankAccounts(selectedBill.vendorId)
      .then((accounts) => {
        const active = accounts.filter((a) => a.isActive);
        setVendorAccounts(active);
        const primary = active.find((a) => a.isPrimary);
        if (primary) setVendorBankAccountId(primary.id);
      })
      .catch(() => {})
      .finally(() => setLoadingVendorAccounts(false));
  }, [selectedBill?.vendorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!vendorBillId) {
      setError("Select a vendor bill.");
      return;
    }
    if (!value || value <= 0) {
      setError("Enter a payment amount greater than zero.");
      return;
    }
    if (!mode) {
      setError("Select a payment mode.");
      return;
    }
    if (!isCash && !companyBankAccountId) {
      setError("Select the company bank account this payment was made from.");
      return;
    }
    if (!isCash && !vendorBankAccountId) {
      setError("Select the vendor bank account receiving this payment.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await recordVendorPayment({
        vendorBillId,
        amount: value,
        mode,
        companyBankAccountId: isCash ? undefined : companyBankAccountId,
        vendorBankAccountId: isCash ? undefined : vendorBankAccountId,
        paymentDate,
        referenceNumber: referenceNumber || undefined,
        attachmentFileName: attachmentFileName || undefined,
        attachmentFileUrl: attachmentFileUrl || undefined,
        remarks: remarks || undefined,
      });
      navigate("/vendor-payments");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record vendor payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Record Vendor Payment</h1>
          <p className="mt-2 text-slate-500">Record a payment against an outstanding vendor bill.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-8 shadow-sm">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium">Vendor Bill *</label>
              <select
                value={vendorBillId}
                onChange={(e) => setVendorBillId(e.target.value)}
                required
                className="w-full rounded-lg border p-3"
              >
                <option value="">{loadingBills ? "Loading bills..." : "Select an outstanding bill"}</option>
                {bills.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.billNumber} — {b.vendor?.name ?? "Unknown vendor"} (₹{Number(b.outstandingBalance).toLocaleString("en-IN")} due)
                  </option>
                ))}
              </select>
              {!loadingBills && bills.length === 0 && (
                <p className="mt-1 text-sm text-amber-600">No vendor bills with an outstanding balance.</p>
              )}
            </div>

            {selectedBill && (
              <div className="rounded-lg bg-slate-50 p-4 text-sm">
                <p className="text-slate-500">Total Amount: <strong className="text-slate-900">₹{Number(selectedBill.totalAmount).toLocaleString("en-IN")}</strong></p>
                <p className="mt-1 text-slate-500">Already Paid: <strong className="text-slate-900">₹{Number(selectedBill.paidAmount).toLocaleString("en-IN")}</strong></p>
                <p className="mt-1 text-slate-500">Outstanding: <strong className="text-red-600">₹{Number(selectedBill.outstandingBalance).toLocaleString("en-IN")}</strong></p>
              </div>
            )}

            <div>
              <label className="mb-2 block font-medium">Amount *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                max={selectedBill ? Number(selectedBill.outstandingBalance) : undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">Payment Mode *</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)} required className="w-full rounded-lg border p-3">
                <option value="">Select Mode</option>
                {PAYMENT_MODE_OPTIONS.map((m) => (
                  <option key={m} value={m}>{PAYMENT_MODE_LABELS[m]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-medium">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-lg border p-3"
              />
            </div>

            {!isCash && (
              <>
                <div>
                  <label className="mb-2 block font-medium">Pay From (Company Account) *</label>
                  <select
                    value={companyBankAccountId}
                    onChange={(e) => setCompanyBankAccountId(e.target.value)}
                    required
                    className="w-full rounded-lg border p-3"
                  >
                    <option value="">Select Company Account</option>
                    {companyAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nickname || a.bankName} — {a.bankName} (••••{a.accountNumber.slice(-4)})
                      </option>
                    ))}
                  </select>
                  {companyAccounts.length === 0 && (
                    <p className="mt-1 text-sm text-amber-600">No company bank accounts on file. Add one under Company Bank Accounts.</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block font-medium">Pay To (Vendor Account) *</label>
                  <select
                    value={vendorBankAccountId}
                    onChange={(e) => setVendorBankAccountId(e.target.value)}
                    required
                    disabled={!selectedBill}
                    className="w-full rounded-lg border p-3 disabled:bg-slate-50"
                  >
                    <option value="">{loadingVendorAccounts ? "Loading..." : "Select Vendor Account"}</option>
                    {vendorAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nickname || a.bankName} — {a.bankName} (••••{a.accountNumber.slice(-4)})
                      </option>
                    ))}
                  </select>
                  {selectedBill && !loadingVendorAccounts && vendorAccounts.length === 0 && (
                    <p className="mt-1 text-sm text-amber-600">This vendor has no bank accounts on file. Add one from the vendor's detail page.</p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="mb-2 block font-medium">Reference / UTR / Cheque No.</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. UTR or cheque number"
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block font-medium">Remarks</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Notes"
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">Attachment File Name</label>
              <input
                type="text"
                value={attachmentFileName}
                onChange={(e) => setAttachmentFileName(e.target.value)}
                placeholder="e.g. payment-receipt.pdf"
                className="w-full rounded-lg border p-3"
              />
            </div>
            <div>
              <label className="mb-2 block font-medium">Attachment File URL</label>
              <input
                type="text"
                value={attachmentFileUrl}
                onChange={(e) => setAttachmentFileUrl(e.target.value)}
                placeholder="Uploaded file URL (once storage is wired up)"
                className="w-full rounded-lg border p-3"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => navigate("/vendor-payments")} className="rounded-lg border px-6 py-3">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
