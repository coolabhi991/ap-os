import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import PaymentHistoryTable from "../../components/vendor-bills/PaymentHistoryTable";

import {
  getVendorBill,
  recordVendorBillPayment,
  cancelVendorBill,
  VENDOR_BILL_STATUS_LABELS,
  VENDOR_BILL_STATUS_COLORS,
} from "../../services/vendor-bills";
import type { VendorBill } from "../../services/vendor-bills";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-semibold">{value || "—"}</p>
    </div>
  );
}

export default function ViewVendorBill() {
  const { id } = useParams<{ id: string }>();

  const [bill, setBill] = useState<VendorBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showPayment, setShowPayment] = useState(false);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("");
  const [remarks, setRemarks] = useState("");
  const [recording, setRecording] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const result = await getVendorBill(id);
      setBill(result);
    } catch {
      setError("Vendor bill not found or failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const value = Number(amount);
    if (!value || value <= 0) {
      setPaymentError("Enter a payment amount greater than zero.");
      return;
    }
    try {
      setRecording(true);
      setPaymentError(null);
      await recordVendorBillPayment(id, { amount: value, mode: mode || undefined, remarks: remarks || undefined });
      setShowPayment(false);
      setAmount("");
      setMode("");
      setRemarks("");
      await load();
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Failed to record payment.");
    } finally {
      setRecording(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    if (!window.confirm("Cancel this vendor bill? This cannot be undone.")) return;
    try {
      await cancelVendorBill(id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel vendor bill.");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">
          Loading vendor bill...
        </div>
      </Layout>
    );
  }

  if (error || !bill) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Vendor Bill Not Found</h1>
          <p className="mt-2 text-slate-500">{error ?? "This vendor bill does not exist."}</p>
        </div>
      </Layout>
    );
  }

  const canRecordPayment = bill.status !== "PAID" && bill.status !== "CANCELLED";
  const canCancel = bill.status !== "CANCELLED" && Number(bill.paidAmount) === 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{bill.billNumber}</h1>
              <p className="mt-2 text-slate-500">
                {bill.vendor?.name && <span>{bill.vendor.name} • </span>}
                {bill.project?.name && <span>{bill.project.name}</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {bill.isOverdue && (
                <span className="rounded-full bg-red-100 px-4 py-2 font-medium text-red-700">Overdue</span>
              )}
              <span
                className={`rounded-full px-4 py-2 font-medium ${
                  VENDOR_BILL_STATUS_COLORS[bill.status] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                {VENDOR_BILL_STATUS_LABELS[bill.status] ?? bill.status}
              </span>
              {canRecordPayment && (
                <button
                  onClick={() => setShowPayment((v) => !v)}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
                >
                  Record Payment
                </button>
              )}
              {canCancel && (
                <button
                  onClick={handleCancel}
                  className="rounded-lg border border-red-200 px-5 py-2.5 text-red-600 hover:bg-red-50"
                >
                  Cancel Bill
                </button>
              )}
            </div>
          </div>

          {showPayment && (
            <form onSubmit={handleRecordPayment} className="mt-6 grid gap-4 rounded-lg border border-slate-200 p-5 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Amount</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Mode</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full rounded-lg border p-3">
                  <option value="">Select Mode</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Reference / notes"
                  className="w-full rounded-lg border p-3"
                />
              </div>
              {paymentError && (
                <div className="md:col-span-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {paymentError}
                </div>
              )}
              <div className="md:col-span-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPayment(false)} className="rounded-lg border px-5 py-2.5">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recording}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {recording ? "Saving..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Amount summary */}
        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total Amount</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{bill.totalAmount}</h2>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Paid Amount</p>
            <h2 className="mt-2 text-3xl font-bold text-emerald-600">{bill.paidAmount}</h2>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Outstanding Balance</p>
            <h2 className="mt-2 text-3xl font-bold text-red-600">{bill.outstandingBalance}</h2>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Due Date</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{bill.dueDate || "—"}</h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">Bill Details</h2>
            <div className="space-y-4">
              <Row label="Bill Date" value={bill.billDate} />
              <Row label="Bill Amount" value={bill.billAmount} />
              <Row label="Taxable Amount" value={bill.taxableAmount} />
              <Row label="GST" value={bill.gstAmount} />
              <Row label="Purchase Order" value={bill.purchaseOrder?.poNumber ?? ""} />
              <Row label="Material Receipt" value={bill.materialReceipt?.receiptNumber ?? ""} />
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">Invoice &amp; Notes</h2>
            <div className="space-y-4">
              <Row label="Invoice File" value={bill.invoiceFileName} />
              <Row label="Invoice URL" value={bill.invoiceFileUrl} />
              <Row label="Notes" value={bill.notes} />
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Payment History</h2>
          <PaymentHistoryTable payments={bill.payments} />
        </div>
      </div>
    </Layout>
  );
}
