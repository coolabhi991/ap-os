import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Download, FileSpreadsheet, Printer, Mail } from "lucide-react";

import Layout from "../../components/layout/Layout";
import EmailDPRModal from "../../components/dpr/EmailDPRModal";
import DocumentUploadPanel from "../../components/documents/DocumentUploadPanel";
import { getDPR, exportDPRPdf, exportDPRExcel, SHIFT_LABELS, VISITOR_TYPE_LABELS, SITE_PROBLEM_TYPE_LABELS } from "../../services/dpr";
import type { DPRDetail } from "../../services/dpr";
import { getDocumentsByDPR, DPR_ATTACHMENT_TYPE_OPTIONS } from "../../services/documents";
import { formatCurrency as inr } from "../../lib/utils";


function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-semibold">{value || "—"}</p>
    </div>
  );
}

export default function ViewDPR() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dpr, setDpr] = useState<DPRDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    getDPR(id)
      .then(setDpr)
      .catch(() => setError("DPR not found."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  if (loading) return <Layout><div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div></Layout>;
  if (error || !dpr) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">DPR Not Found</h1>
          <p className="mt-2 text-slate-500">{error}</p>
        </div>
      </Layout>
    );
  }

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      await exportDPRPdf(dpr.id, dpr.dprNumber);
    } catch {
      alert("Failed to export PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      await exportDPRExcel(dpr.id, dpr.dprNumber);
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
            <button onClick={() => navigate("/dpr")} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">← Back</button>
            <button onClick={() => navigate(`/dpr/${dpr.id}/edit`)} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Edit</button>
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

        {/* Government-style DPR document */}
        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
          <div className="border-b-2 border-slate-800 pb-4 text-center">
            <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">Daily Progress Report</h1>
            <p className="text-sm text-slate-500">Official Site Diary</p>
            <div className="mt-2 flex justify-center gap-6 text-sm">
              <span><strong>DPR No:</strong> {dpr.dprNumber}</span>
              <span><strong>Date:</strong> {dpr.reportDate}</span>
              <span><strong>Shift:</strong> {SHIFT_LABELS[dpr.shift] ?? dpr.shift}</span>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-base font-bold text-slate-800">General Information</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Project" value={dpr.project?.name ?? ""} />
              <Field label="Site" value={dpr.site} />
              <Field label="Sub Work" value={dpr.subWork?.name ?? ""} />
              <Field label="Engineer" value={dpr.engineer?.name ?? ""} />
              <Field label="Contractor" value={dpr.contractor?.name ?? ""} />
              <Field label="Weather" value={dpr.weather} />
            </div>
            {dpr.remarks && <p className="mt-3 text-sm text-slate-600"><strong>Remarks:</strong> {dpr.remarks}</p>}
          </div>

          <div>
            <h2 className="mb-3 text-base font-bold text-slate-800">Work Progress</h2>
            <div className="space-y-3">
              <Field label="Work Done Today" value={dpr.workDone} />
              <Field label="Planned Work" value={dpr.plannedWork} />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Physical Progress Update" value={dpr.physicalProgressUpdate !== null ? `${dpr.physicalProgressUpdate}%` : ""} />
                <Field label="Delay Reason" value={dpr.delayReason} />
              </div>
              <Field label="Instructions" value={dpr.instructions} />
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-base font-bold text-slate-800">Labour Summary</h2>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100"><tr><th className="px-4 py-2 text-left">Skilled</th><th className="px-4 py-2 text-left">Unskilled</th><th className="px-4 py-2 text-left">Supervisor</th><th className="px-4 py-2 text-left">Operator</th><th className="px-4 py-2 text-left">Total</th></tr></thead>
                <tbody><tr className="border-t"><td className="px-4 py-2">{dpr.labourSkilled}</td><td className="px-4 py-2">{dpr.labourUnskilled}</td><td className="px-4 py-2">{dpr.labourSupervisor}</td><td className="px-4 py-2">{dpr.labourOperator}</td><td className="px-4 py-2 font-bold">{dpr.labourTotal}</td></tr></tbody>
              </table>
            </div>
            {dpr.labourManuallyAdjusted && <p className="mt-1 text-xs text-amber-600">Manually adjusted by the engineer.</p>}
          </div>

          <div>
            <h2 className="mb-3 text-base font-bold text-slate-800">Machinery Summary</h2>
            {(dpr.machinerySummary.length || dpr.manualMachineryEntries.length) ? (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100"><tr><th className="px-4 py-2 text-left">Machine Type</th><th className="px-4 py-2 text-right">Hours</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2 text-left">Source</th></tr></thead>
                  <tbody>
                    {dpr.machinerySummary.map((m) => (
                      <tr key={m.id} className="border-t"><td className="px-4 py-2">{m.machineType || "—"}</td><td className="px-4 py-2 text-right">{m.hours}</td><td className="px-4 py-2 text-right">{inr(m.amount)}</td><td className="px-4 py-2 text-slate-400">Auto (Site Expense)</td></tr>
                    ))}
                    {dpr.manualMachineryEntries.map((m, i) => (
                      <tr key={`manual-${i}`} className="border-t"><td className="px-4 py-2">{m.machineType}</td><td className="px-4 py-2 text-right">{m.hours}</td><td className="px-4 py-2 text-right">{inr(m.amount)}</td><td className="px-4 py-2 text-slate-400">Manual</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No machinery usage recorded for this date.</p>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-base font-bold text-slate-800">Material Summary</h2>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div>
                <p className="mb-2 font-medium text-slate-600">Received Today</p>
                {dpr.materialSummary.materialReceivedToday.length ? (
                  <ul className="space-y-1 text-slate-600">{dpr.materialSummary.materialReceivedToday.map((r) => <li key={r.id}>{r.itemName} — {r.quantity} {r.unit}</li>)}</ul>
                ) : <p className="text-slate-400">None.</p>}
              </div>
              <div>
                <p className="mb-2 font-medium text-slate-600">Issued Today</p>
                {dpr.materialSummary.materialIssuedToday.length ? (
                  <ul className="space-y-1 text-slate-600">{dpr.materialSummary.materialIssuedToday.map((i) => <li key={i.id}>{i.itemName} — {i.quantity} {i.unit}</li>)}</ul>
                ) : <p className="text-slate-400">None.</p>}
              </div>
              <div>
                <p className="mb-2 font-medium text-slate-600">Major Materials Used</p>
                {dpr.materialSummary.majorMaterialsUsed.length ? (
                  <ul className="space-y-1 text-slate-600">{dpr.materialSummary.majorMaterialsUsed.map((m, i) => <li key={i}>{m.itemName} — {m.quantity} {m.unit}</li>)}</ul>
                ) : <p className="text-slate-400">None.</p>}
              </div>
            </div>
          </div>

          {dpr.visitors.length > 0 && (
            <div>
              <h2 className="mb-3 text-base font-bold text-slate-800">Visitors</h2>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100"><tr><th className="px-4 py-2 text-left">Type</th><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">Remarks</th></tr></thead>
                  <tbody>
                    {dpr.visitors.map((v) => (
                      <tr key={v.id} className="border-t"><td className="px-4 py-2">{VISITOR_TYPE_LABELS[v.visitorType] ?? v.visitorType}</td><td className="px-4 py-2">{v.name || "—"}</td><td className="px-4 py-2">{v.remarks || "—"}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {dpr.siteProblems.length > 0 && (
            <div>
              <h2 className="mb-3 text-base font-bold text-slate-800">Site Problems</h2>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100"><tr><th className="px-4 py-2 text-left">Problem</th><th className="px-4 py-2 text-left">Description</th></tr></thead>
                  <tbody>
                    {dpr.siteProblems.map((p) => (
                      <tr key={p.id} className="border-t"><td className="px-4 py-2">{SITE_PROBLEM_TYPE_LABELS[p.problemType] ?? p.problemType}</td><td className="px-4 py-2">{p.description || "—"}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="border-t pt-4 text-xs text-slate-400">
            Prepared by: {dpr.createdBy?.name ?? "—"} &nbsp;|&nbsp; Generated: {new Date().toLocaleString()}
          </div>
        </div>

        <div className="print:hidden">
          <DocumentUploadPanel
            title="Photos & Attachments"
            documentTypeOptions={DPR_ATTACHMENT_TYPE_OPTIONS}
            fetchDocuments={() => getDocumentsByDPR(dpr.id)}
            createParams={{ projectId: dpr.projectId, dprId: dpr.id }}
          />
        </div>
      </div>

      {showEmailModal && (
        <EmailDPRModal
          dprId={dpr.id}
          onClose={() => setShowEmailModal(false)}
          onSent={() => {
            setShowEmailModal(false);
            alert("DPR emailed successfully.");
          }}
        />
      )}
    </Layout>
  );
}
