import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Download, FileSpreadsheet, Printer, Mail, MessageCircle, Plus, Trash2, IndianRupee } from "lucide-react";

import Layout from "../../components/layout/Layout";
import EmailRunningBillModal from "../../components/running-bills/EmailRunningBillModal";
import RecordPaymentModal from "../../components/running-bills/RecordPaymentModal";
import {
  getRunningBill,
  getRunningBillPayments,
  submitRunningBill,
  passRunningBill,
  exportRunningBillPdf,
  exportRunningBillExcel,
  getRunningBillEmailLogs,
  RB_STATUS_LABELS,
  RB_STATUS_COLORS,
  BILL_TYPE_LABELS,
  DEDUCTION_TYPE_LABELS,
} from "../../services/running-bills";
import type { RunningBill, PaymentRegisterRow, RunningBillEmailLog } from "../../services/running-bills";
import { getDocumentsByRunningBill, createDocument, deleteDocument, RUNNING_BILL_ATTACHMENT_TYPE_OPTIONS, DOCUMENT_TYPE_LABELS } from "../../services/documents";
import type { ProjectDocument } from "../../services/documents";
import { formatCurrency as inr } from "../../lib/utils";
import EmptyTableRow from "../../components/ui/EmptyTableRow";


function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-semibold">{value || "—"}</p>
    </div>
  );
}

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
  const [emailLogs, setEmailLogs] = useState<RunningBillEmailLog[]>([]);

  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState("GOVERNMENT_LETTER");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadFileUrl, setUploadFileUrl] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    getRunningBill(id)
      .then(setBill)
      .catch(() => setError("Running Bill not found."))
      .finally(() => setLoading(false));
    getRunningBillPayments(id).then(setPayments).catch(() => {});
    getDocumentsByRunningBill(id).then(setDocuments).catch(() => {});
    getRunningBillEmailLogs(id).then(setEmailLogs).catch(() => {});
  };

  useEffect(load, [id]);

  if (loading) return <Layout><div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div></Layout>;
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim() && !uploadFileUrl.trim()) {
      setUploadError("Either a file name or file URL is required.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      await createDocument({ projectId: bill.projectId, runningBillId: bill.id, documentType: uploadType, fileName: uploadFileName, fileUrl: uploadFileUrl, notes: uploadNotes });
      setUploadFileName("");
      setUploadFileUrl("");
      setUploadNotes("");
      setShowUpload(false);
      if (id) getDocumentsByRunningBill(id).then(setDocuments).catch(() => {});
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to add attachment.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm("Remove this attachment?")) return;
    await deleteDocument(docId);
    if (id) getDocumentsByRunningBill(id).then(setDocuments).catch(() => {});
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

        {/* Government-style Running Bill document */}
        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
          <div className="border-b-2 border-slate-800 pb-4 text-center">
            <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">Running Bill — {BILL_TYPE_LABELS[bill.billType] ?? bill.billType}</h1>
            <p className="text-sm text-slate-500">Client Billing Record</p>
            <div className="mt-2 flex flex-wrap justify-center gap-6 text-sm">
              <span><strong>Bill No:</strong> {bill.billNumber}</span>
              <span><strong>Date:</strong> {bill.billDate}</span>
              <span className="inline-flex items-center gap-1">
                <strong>Status:</strong>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RB_STATUS_COLORS[bill.status]}`}>{RB_STATUS_LABELS[bill.status] ?? bill.status}</span>
              </span>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-base font-bold text-slate-800">General Information</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Project" value={bill.project?.name ?? ""} />
              <Field label="Site" value={bill.site} />
              <Field label="Sub Work" value={bill.subWork?.name ?? ""} />
              <Field label="Measurement Book" value={bill.measurementBook?.mbNumber ?? ""} />
              <Field label="Bill Period" value={bill.billPeriodFrom && bill.billPeriodTo ? `${bill.billPeriodFrom} to ${bill.billPeriodTo}` : ""} />
            </div>
            {bill.remarks && <p className="mt-3 text-sm text-slate-600"><strong>Remarks:</strong> {bill.remarks}</p>}
          </div>

          <div>
            <h2 className="mb-3 text-base font-bold text-slate-800">Abstract</h2>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-2 py-2 text-left">Item No.</th>
                    <th className="px-2 py-2 text-left">Description</th>
                    <th className="px-2 py-2 text-left">Unit</th>
                    <th className="px-2 py-2 text-right">Prev Qty</th>
                    <th className="px-2 py-2 text-right">Curr Qty</th>
                    <th className="px-2 py-2 text-right">Total Qty</th>
                    <th className="px-2 py-2 text-right">BOQ Rate</th>
                    <th className="px-2 py-2 text-right">Payment %</th>
                    <th className="px-2 py-2 text-right">Eff. Rate</th>
                    <th className="px-2 py-2 text-right">Prev Amt</th>
                    <th className="px-2 py-2 text-right">Curr Amt</th>
                    <th className="px-2 py-2 text-right">Total Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-2 py-2">{item.boqItemNo}</td>
                      <td className="px-2 py-2">{item.boqDescription}</td>
                      <td className="px-2 py-2">{item.unit}</td>
                      <td className="px-2 py-2 text-right">{Number(item.previousQuantity).toFixed(4)}</td>
                      <td className="px-2 py-2 text-right font-medium">{Number(item.currentQuantity).toFixed(4)}</td>
                      <td className="px-2 py-2 text-right">{Number(item.totalQuantity).toFixed(4)}</td>
                      <td className="px-2 py-2 text-right">{inr(item.boqRate)}</td>
                      <td className="px-2 py-2 text-right">{Number(item.paymentPercent)}%</td>
                      <td className="px-2 py-2 text-right">{inr(item.effectiveRate)}</td>
                      <td className="px-2 py-2 text-right">{inr(item.previousAmount)}</td>
                      <td className="px-2 py-2 text-right font-medium">{inr(item.currentAmount)}</td>
                      <td className="px-2 py-2 text-right">{inr(item.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-slate-50 font-bold">
                    <td className="px-2 py-2" colSpan={9}>Total</td>
                    <td className="px-2 py-2 text-right">{inr(bill.previousCertifiedAmount)}</td>
                    <td className="px-2 py-2 text-right">{inr(bill.currentCertifiedAmount)}</td>
                    <td className="px-2 py-2 text-right">{inr(bill.totalCertifiedAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {bill.deductions.length > 0 && (
            <div>
              <h2 className="mb-3 text-base font-bold text-slate-800">Deductions</h2>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100"><tr><th className="px-4 py-2 text-left">Type</th><th className="px-4 py-2 text-left">Label</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2 text-left">Remarks</th></tr></thead>
                  <tbody>
                    {bill.deductions.map((d) => (
                      <tr key={d.id} className="border-t">
                        <td className="px-4 py-2">{DEDUCTION_TYPE_LABELS[d.type] ?? d.type}</td>
                        <td className="px-4 py-2">{d.label}</td>
                        <td className="px-4 py-2 text-right">{inr(d.amount)}</td>
                        <td className="px-4 py-2 text-slate-500">{d.remarks || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-6 md:grid-cols-3">
            <div><p className="text-sm text-slate-500">Net Payable (Submitted)</p><p className="text-lg font-bold">{inr(bill.netPayable)}</p></div>
            <div><p className="text-sm text-slate-500">Amount Received</p><p className="text-lg font-bold text-emerald-600">{inr(bill.amountReceived)}</p></div>
            <div><p className="text-sm text-slate-500">Outstanding</p><p className="text-lg font-bold text-amber-600">{inr(bill.outstandingAmount)}</p></div>
          </div>

          <div className="border-t pt-4 text-xs text-slate-400">
            Prepared by: {bill.createdBy?.name ?? "—"} &nbsp;|&nbsp; Generated: {new Date().toLocaleString()}
          </div>
        </div>

        {/* Payment Tracking */}
        <div className="space-y-4 print:hidden">
          <h2 className="text-xl font-bold text-slate-900">Payments Received</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full">
              <thead className="bg-slate-100">
                <tr><th className="px-4 py-3 text-left">Payment #</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-left">Mode</th><th className="px-4 py-3 text-left">Reference</th><th className="px-4 py-3 text-left">Bank Account</th></tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <EmptyTableRow colSpan={6}>No payments recorded yet.</EmptyTableRow>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{p.paymentNumber}</td>
                      <td className="px-4 py-3">{p.paymentDate}</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600">{inr(p.amount)}</td>
                      <td className="px-4 py-3">{p.mode}</td>
                      <td className="px-4 py-3 text-slate-500">{p.referenceNumber || "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{p.companyBankAccount ? `${p.companyBankAccount.bankName} (${p.companyBankAccount.accountNumber})` : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Documents */}
        <div className="space-y-4 print:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Documents & Attachments</h2>
            <button onClick={() => setShowUpload((v) => !v)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>

          {showUpload && (
            <form onSubmit={handleUpload} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              {uploadError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{uploadError}</div>}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Type</label>
                  <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} className="w-full rounded-lg border p-2.5">
                    {RUNNING_BILL_ATTACHMENT_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">File Name</label>
                  <input value={uploadFileName} onChange={(e) => setUploadFileName(e.target.value)} placeholder="e.g. govt-sanction-letter.pdf" className="w-full rounded-lg border p-2.5" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">File URL</label>
                  <input value={uploadFileUrl} onChange={(e) => setUploadFileUrl(e.target.value)} placeholder="Uploaded file URL (once storage is wired up)" className="w-full rounded-lg border p-2.5" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Notes</label>
                  <textarea rows={2} value={uploadNotes} onChange={(e) => setUploadNotes(e.target.value)} className="w-full rounded-lg border p-2.5" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowUpload(false)} className="rounded-lg border px-5 py-2.5">Cancel</button>
                <button type="submit" disabled={uploading} className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60">
                  {uploading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full">
              <thead className="bg-slate-100">
                <tr><th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3 text-left">File</th><th className="px-4 py-3 text-left">Notes</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <EmptyTableRow colSpan={4}>No attachments yet.</EmptyTableRow>
                ) : (
                  documents.map((d) => (
                    <tr key={d.id} className="border-t">
                      <td className="px-4 py-3">{DOCUMENT_TYPE_LABELS[d.documentType] ?? d.documentType}</td>
                      <td className="px-4 py-3">
                        {d.fileUrl ? <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{d.fileName || d.fileUrl}</a> : d.fileName || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{d.notes || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDeleteDocument(d.id)} className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Email history */}
        <div className="space-y-4 print:hidden">
          <h2 className="text-xl font-bold text-slate-900">Email History</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full">
              <thead className="bg-slate-100">
                <tr><th className="px-4 py-3 text-left">Sent At</th><th className="px-4 py-3 text-left">Recipients</th><th className="px-4 py-3 text-left">Excel Attached</th><th className="px-4 py-3 text-left">Status</th></tr>
              </thead>
              <tbody>
                {emailLogs.length === 0 ? (
                  <EmptyTableRow colSpan={4}>No emails sent yet.</EmptyTableRow>
                ) : (
                  emailLogs.map((log) => (
                    <tr key={log.id} className="border-t">
                      <td className="px-4 py-3">{new Date(log.sentAt).toLocaleString()}</td>
                      <td className="px-4 py-3">{log.recipients.map((r) => r.label || r.email).join(", ")}</td>
                      <td className="px-4 py-3">{log.includedExcel ? "Yes" : "No"}</td>
                      <td className="px-4 py-3">
                        {log.status === "SENT" ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Sent</span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700" title={log.errorMessage}>Failed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
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
