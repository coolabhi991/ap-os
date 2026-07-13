import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Download, FileSpreadsheet, Printer, Mail } from "lucide-react";

import Layout from "../../components/layout/Layout";
import EmailMBModal from "../../components/measurement-books/EmailMBModal";
import { getMB, exportMBPdf, exportMBExcel, getMBEmailLogs, MB_STATUS_LABELS, MB_STATUS_COLORS } from "../../services/measurement-books";
import type { MB, MBEmailLog } from "../../services/measurement-books";
import EmptyTableRow from "../../components/ui/EmptyTableRow";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-semibold">{value || "—"}</p>
    </div>
  );
}

export default function ViewMB() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mb, setMb] = useState<MB | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailLogs, setEmailLogs] = useState<MBEmailLog[]>([]);

  const load = () => {
    if (!id) return;
    setLoading(true);
    getMB(id)
      .then(setMb)
      .catch(() => setError("Measurement Book not found."))
      .finally(() => setLoading(false));
    getMBEmailLogs(id).then(setEmailLogs).catch(() => {});
  };

  useEffect(load, [id]);

  if (loading) return <Layout><div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div></Layout>;
  if (error || !mb) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Measurement Book Not Found</h1>
          <p className="mt-2 text-slate-500">{error}</p>
        </div>
      </Layout>
    );
  }

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      await exportMBPdf(mb.id, mb.mbNumber);
    } catch {
      alert("Failed to export PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      await exportMBExcel(mb.id, mb.mbNumber);
    } catch {
      alert("Failed to export Excel.");
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/measurement-books")} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">← Back</button>
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
            <button onClick={() => setShowEmailModal(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              <Mail className="h-4 w-4" /> Email
            </button>
          </div>
        </div>

        {/* Government-style MB document */}
        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
          <div className="border-b-2 border-slate-800 pb-4 text-center">
            <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">Measurement Book</h1>
            <p className="text-sm text-slate-500">Official BOQ Measurement & Abstract Record</p>
            <div className="mt-2 flex flex-wrap justify-center gap-6 text-sm">
              <span><strong>MB No:</strong> {mb.mbNumber}</span>
              <span><strong>Date:</strong> {mb.mbDate}</span>
              <span className="inline-flex items-center gap-1">
                <strong>Status:</strong>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${MB_STATUS_COLORS[mb.status]}`}>{MB_STATUS_LABELS[mb.status] ?? mb.status}</span>
              </span>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-base font-bold text-slate-800">General Information</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Project" value={mb.project?.name ?? ""} />
              <Field label="Site" value={mb.site} />
              <Field label="Sub Work" value={mb.subWork?.name ?? ""} />
              <Field label="Engineer" value={mb.engineer?.name ?? ""} />
              <Field label="Contractor" value={mb.contractor?.name ?? ""} />
            </div>
            {mb.remarks && <p className="mt-3 text-sm text-slate-600"><strong>Remarks:</strong> {mb.remarks}</p>}
          </div>

          <div>
            <h2 className="mb-3 text-base font-bold text-slate-800">Abstract Sheet — Form 58</h2>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-2 py-2 text-left">Sr No</th>
                    <th className="px-2 py-2 text-left">Item of Work</th>
                    <th className="px-2 py-2 text-right">Qty</th>
                    <th className="px-2 py-2 text-left">Unit</th>
                    <th className="px-2 py-2 text-right">Rate</th>
                    <th className="px-2 py-2 text-right">Up To Date Amount</th>
                    <th className="px-2 py-2 text-right">Since Previous</th>
                    <th className="px-2 py-2 text-right">Now To Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {mb.items.length === 0 ? (
                    <EmptyTableRow colSpan={8}>No BOQ rows recorded.</EmptyTableRow>
                  ) : (
                    mb.items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-2 py-2">{item.boqItemNo}</td>
                        <td className="px-2 py-2">{item.boqDescription}</td>
                        <td className="px-2 py-2 text-right font-medium">{Number(item.totalQuantity).toFixed(4)}</td>
                        <td className="px-2 py-2">{item.unit}</td>
                        <td className="px-2 py-2 text-right">₹{Number(item.effectiveRate).toLocaleString("en-IN")}</td>
                        <td className="px-2 py-2 text-right">₹{Number(item.totalAmount).toLocaleString("en-IN")}</td>
                        <td className="px-2 py-2 text-right">₹{Number(item.previousAmount).toLocaleString("en-IN")}</td>
                        <td className="px-2 py-2 text-right font-medium">₹{Number(item.amount).toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {mb.items.length > 0 && (
            <div className="ml-auto max-w-sm space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex justify-between font-medium"><span>Total Amount</span><span>₹{Number(mb.form58.totalNowToPay).toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between text-slate-500">
                <span>Above / Below ({Number(mb.aboveBelowPercent) >= 0 ? "+" : ""}{Number(mb.aboveBelowPercent)}%) — Amount</span>
                <span>₹{Number(mb.form58.aboveBelowAmount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between font-medium"><span>Net Value</span><span>₹{Number(mb.form58.netValue).toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between text-slate-500">
                <span>GST ({Number(mb.gstPercent)}%)</span>
                <span>₹{Number(mb.form58.gstAmount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-1.5 text-base font-bold"><span>Grand Total</span><span>₹{Number(mb.form58.grandTotal).toLocaleString("en-IN")}</span></div>
            </div>
          )}

          <div className="border-t pt-4 text-xs text-slate-400">
            Prepared by: {mb.createdBy?.name ?? "—"} &nbsp;|&nbsp; Generated: {new Date().toLocaleString()}
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
        <EmailMBModal
          mbId={mb.id}
          onClose={() => setShowEmailModal(false)}
          onSent={() => {
            setShowEmailModal(false);
            alert("Measurement Book emailed successfully.");
            load();
          }}
        />
      )}
    </Layout>
  );
}
