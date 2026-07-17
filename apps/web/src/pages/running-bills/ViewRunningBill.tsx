import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Download, FileSpreadsheet, Printer, Mail, MessageCircle, IndianRupee } from "lucide-react";

import Layout from "../../components/layout/Layout";
import EmailRunningBillModal from "../../components/running-bills/EmailRunningBillModal";
import RecordPaymentModal from "../../components/running-bills/RecordPaymentModal";
import RunningBillLifecycle from "../../components/running-bills/RunningBillLifecycle";
import RunningBillWorkspace from "../../components/running-bills/RunningBillWorkspace";
import {
  getRunningBill,
  getRunningBillPayments,
  submitRunningBill,
  passRunningBill,
  exportRunningBillPdf,
  exportRunningBillExcel,
  RB_STATUS_LABELS,
  RB_STATUS_COLORS,
  BILL_TYPE_LABELS,
} from "../../services/running-bills";
import type { RunningBill, PaymentRegisterRow } from "../../services/running-bills";
import { formatCurrency as inr } from "../../lib/utils";
import LoadingState from "../../components/ui/LoadingState";

export default function ViewRunningBill() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bill, setBill] = useState<RunningBill | null>(null);
  const [payments, setPayments] = useState<PaymentRegisterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    getRunningBill(id)
      .then(setBill)
      .catch(() => setError("Running Bill not found."))
      .finally(() => setLoading(false));
    getRunningBillPayments(id).then(setPayments).catch(() => {});
  };

  useEffect(load, [id]);

  if (loading) return <Layout><LoadingState label="Loading Running Bill..." /></Layout>;
  if (error || !bill) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Running Bill Not Found</h1>
          <p className="mt-2 text-slate-500">{error}</p>
        </div>
      </Layout>
    );
  }

  const handleSubmitBill = async () => {
    if (!window.confirm("Submit this Running Bill? It will leave Draft and can no longer be edited.")) return;
    setBusy(true);
    try {
      await submitRunningBill(bill.id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit Running Bill.");
    } finally {
      setBusy(false);
    }
  };

  const handlePassBill = async () => {
    if (!window.confirm("Mark this Running Bill as Passed (certified)?")) return;
    setBusy(true);
    try {
      await passRunningBill(bill.id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to pass Running Bill.");
    } finally {
      setBusy(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      await exportRunningBillPdf(bill.id, bill.billNumber);
    } catch {
      alert("Failed to export PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      await exportRunningBillExcel(bill.id, bill.billNumber);
    } catch {
      alert("Failed to export Excel.");
    } finally {
      setExportingExcel(false);
    }
  };

  const handleWhatsAppShare = () => {
    const text = [
      `Running Bill ${bill.billNumber}`,
      `Project: ${bill.project?.name ?? "-"}`,
      `Bill Date: ${bill.billDate}`,
      `Net Payable: ${inr(bill.netPayable)}`,
      `Amount Received: ${inr(bill.amountReceived)}`,
      `Outstanding: ${inr(bill.outstandingAmount)}`,
      `Status: ${RB_STATUS_LABELS[bill.status] ?? bill.status}`,
    ].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/running-bills")} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">← Back</button>
            {bill.status === "DRAFT" && (
              <>
                <button onClick={() => navigate(`/running-bills/${bill.id}/edit`)} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Edit</button>
                <button onClick={handleSubmitBill} disabled={busy} className="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-60">Submit</button>
              </>
            )}
            {bill.status === "SUBMITTED" && (
              <button onClick={handlePassBill} disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60">Mark as Passed</button>
            )}
            {(bill.status === "PASSED" || bill.status === "PARTLY_PAID") && (
              <button onClick={() => setShowPaymentModal(true)} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700">
                <IndianRupee className="h-4 w-4" /> Record Payment
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExportPdf} disabled={exportingPdf} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60">
              <Download className="h-4 w-4" /> {exportingPdf ? "Exporting..." : "PDF"}
            </button>
            <button onClick={handleExportExcel} disabled={exportingExcel} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60">
              <FileSpreadsheet className="h-4 w-4" /> {exportingExcel ? "Exporting..." : "Excel"}
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button onClick={handleWhatsAppShare} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </button>
            <button onClick={() => setShowEmailModal(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              <Mail className="h-4 w-4" /> Email
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Running Bill — {BILL_TYPE_LABELS[bill.billType] ?? bill.billType}</h1>
              <p className="text-sm text-slate-500">{bill.billNumber} · {bill.project?.name ?? "—"} · {bill.siteRecord?.name ?? "—"}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${RB_STATUS_COLORS[bill.status] ?? "bg-slate-100 text-slate-700"}`}>
              {RB_STATUS_LABELS[bill.status] ?? bill.status}
            </span>
          </div>
        </div>

        <RunningBillLifecycle status={bill.status} />

        <RunningBillWorkspace bill={bill} payments={payments} onRecordPayment={() => setShowPaymentModal(true)} />
      </div>

      {showEmailModal && (
        <EmailRunningBillModal
          runningBillId={bill.id}
          onClose={() => setShowEmailModal(false)}
          onSent={() => {
            setShowEmailModal(false);
            alert("Running Bill emailed successfully.");
            load();
          }}
        />
      )}

      {showPaymentModal && (
        <RecordPaymentModal
          runningBillId={bill.id}
          outstandingAmount={bill.outstandingAmount}
          onClose={() => setShowPaymentModal(false)}
          onRecorded={() => {
            setShowPaymentModal(false);
            load();
          }}
        />
      )}
    </Layout>
  );
}
