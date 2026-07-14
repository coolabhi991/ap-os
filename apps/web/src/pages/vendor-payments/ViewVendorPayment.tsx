import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import { getVendorPayment, PAYMENT_MODE_LABELS } from "../../services/vendor-payments";
import type { VendorPayment } from "../../services/vendor-payments";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-semibold">{value || "—"}</p>
    </div>
  );
}

export default function ViewVendorPayment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<VendorPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getVendorPayment(id)
      .then(setPayment)
      .catch(() => setError("Vendor payment not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div></Layout>;
  if (error || !payment) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Vendor Payment Not Found</h1>
          <p className="mt-2 text-slate-500">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-sm text-blue-600">{payment.paymentNumber}</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                ₹{Number(payment.amount).toLocaleString("en-IN")}
              </h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                {payment.vendor && <span>Vendor: <strong>{payment.vendor.name}</strong></span>}
                {payment.vendorBill && <span>Bill: <strong>{payment.vendorBill.billNumber}</strong></span>}
                {payment.project && <span>Project: <strong>{payment.project.name}</strong></span>}
              </div>
            </div>
            {payment.vendorBill && (
              <button
                onClick={() => navigate(`/vendor-bills/${payment.vendorBill!.id}`)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
              >
                View Bill
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">Payment Details</h2>
            <div className="space-y-4">
              <Row label="Payment Date" value={new Date(payment.paymentDate).toLocaleString()} />
              <Row label="Mode" value={payment.mode ? (PAYMENT_MODE_LABELS[payment.mode] ?? payment.mode) : ""} />
              <Row label="Reference / UTR / Cheque No." value={payment.referenceNumber} />
              {payment.paidToOtherParty && <Row label="Paid To (Third Party)" value={`${payment.paidToName}${payment.paidToReason ? ` — ${payment.paidToReason}` : ""}`} />}
              <Row label="Status" value={payment.status} />
              <Row label="Remarks" value={payment.remarks} />
              {payment.attachmentFileName && (
                <Row label="Attachment" value={payment.attachmentFileUrl || payment.attachmentFileName} />
              )}
              {payment.sourceBankTransaction && (
                <div>
                  <p className="text-sm text-slate-500">Source Bank Transaction</p>
                  <p className="font-semibold">
                    {payment.sourceBankTransaction.transactionDate} — {payment.sourceBankTransaction.bankAccountLabel}
                    {payment.sourceBankTransaction.referenceNumber && ` (Ref: ${payment.sourceBankTransaction.referenceNumber})`}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/banking/accounts/${payment.sourceBankTransaction!.companyBankAccountId}`)}
                    className="mt-1 text-sm text-blue-600 hover:underline"
                  >
                    Open Bank Transaction
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">Bank Accounts</h2>
            <div className="space-y-4">
              {payment.companyBankAccount ? (
                <Row
                  label="Paid From (Company Account)"
                  value={`${payment.companyBankAccount.nickname || payment.companyBankAccount.bankName} — ${payment.companyBankAccount.bankName} (••••${payment.companyBankAccount.accountNumber.slice(-4)})`}
                />
              ) : (
                <Row label="Paid From (Company Account)" value="" />
              )}
              {payment.vendorBankAccount ? (
                <Row
                  label="Paid To (Vendor Account)"
                  value={`${payment.vendorBankAccount.nickname || payment.vendorBankAccount.bankName} — ${payment.vendorBankAccount.bankName} (••••${payment.vendorBankAccount.accountNumber.slice(-4)})`}
                />
              ) : (
                <Row label="Paid To (Vendor Account)" value="" />
              )}
            </div>
          </div>

          {payment.vendorBill && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-bold">Bill Snapshot (at time of viewing)</h2>
              <div className="space-y-4">
                <Row label="Bill Number" value={payment.vendorBill.billNumber} />
                <Row label="Bill Total" value={`₹${Number(payment.vendorBill.totalAmount).toLocaleString("en-IN")}`} />
                <Row label="Outstanding Balance" value={`₹${Number(payment.vendorBill.outstandingBalance).toLocaleString("en-IN")}`} />
                <Row label="Bill Status" value={payment.vendorBill.status} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
