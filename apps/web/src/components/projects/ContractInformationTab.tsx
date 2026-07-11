import { useEffect, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { getProjectContractInfo, saveProjectContractInfo } from "../../services/project-contract-info";
import type { ProjectContractInfoFormData } from "../../services/project-contract-info";
import { getDocuments, createDocument, deleteDocument, CONTRACT_INFO_ATTACHMENT_TYPE_OPTIONS, DOCUMENT_TYPE_LABELS } from "../../services/documents";
import type { ProjectDocument } from "../../services/documents";
import type { Project } from "../../services/projects";

interface Props {
  project: Project;
}

const emptyForm: ProjectContractInfoFormData = {
  workOrderNumber: "",
  workOrderDate: "",
  agreementNumber: "",
  agreementDate: "",
  tenderNumber: "",
  department: "",
  division: "",
  subDivision: "",
  clientEngineer: "",
  contractValue: 0,
  estimateAmount: 0,
  workStartDate: "",
  completionDate: "",
  defectLiabilityPeriod: "",
  securityDepositPercent: 0,
  performanceGuaranteePercent: 0,
  gstPercent: 0,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full rounded-lg border p-2.5";

export default function ContractInformationTab({ project }: Props) {
  const [form, setForm] = useState<ProjectContractInfoFormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string>("");

  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState("WORK_ORDER");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadFileUrl, setUploadFileUrl] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadDocuments = () => getDocuments(project.id).then((docs) => setDocuments(docs.filter((d) => !d.dprId && !d.measurementBookId && !d.runningBillId))).catch(() => {});

  useEffect(() => {
    setLoading(true);
    getProjectContractInfo(project.id)
      .then((info) => {
        setForm({
          workOrderNumber: info.workOrderNumber,
          workOrderDate: info.workOrderDate,
          agreementNumber: info.agreementNumber,
          agreementDate: info.agreementDate,
          tenderNumber: info.tenderNumber,
          department: info.department,
          division: info.division,
          subDivision: info.subDivision,
          clientEngineer: info.clientEngineer,
          contractValue: Number(info.contractValue) || 0,
          estimateAmount: Number(info.estimateAmount) || 0,
          workStartDate: info.workStartDate,
          completionDate: info.completionDate,
          defectLiabilityPeriod: info.defectLiabilityPeriod,
          securityDepositPercent: Number(info.securityDepositPercent) || 0,
          performanceGuaranteePercent: Number(info.performanceGuaranteePercent) || 0,
          gstPercent: Number(info.gstPercent) || 0,
        });
      })
      .catch(() => setError("Failed to load contract information."))
      .finally(() => setLoading(false));
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const update = (patch: Partial<ProjectContractInfoFormData>) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const saved = await saveProjectContractInfo(project.id, form);
      setSavedAt(new Date(saved.updatedAt).toLocaleString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save contract information.");
    } finally {
      setSaving(false);
    }
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
      await createDocument({ projectId: project.id, documentType: uploadType, fileName: uploadFileName, fileUrl: uploadFileUrl, notes: uploadNotes });
      setUploadFileName("");
      setUploadFileUrl("");
      setUploadNotes("");
      setShowUpload(false);
      loadDocuments();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to add document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm("Remove this document?")) return;
    await deleteDocument(id);
    loadDocuments();
  };

  if (loading) return <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading contract information...</div>;

  return (
    <div className="space-y-6">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}

      <form onSubmit={handleSave} className="space-y-8 rounded-xl bg-white p-8 shadow-sm">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-700">Master Contract Record</h2>
            {savedAt && <p className="text-xs text-slate-400">Last saved {savedAt}</p>}
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Field label="Work Order No."><input className={inputClass} value={form.workOrderNumber} onChange={(e) => update({ workOrderNumber: e.target.value })} /></Field>
            <Field label="Work Order Date"><input type="date" className={inputClass} value={form.workOrderDate} onChange={(e) => update({ workOrderDate: e.target.value })} /></Field>
            <Field label="Agreement No."><input className={inputClass} value={form.agreementNumber} onChange={(e) => update({ agreementNumber: e.target.value })} /></Field>
            <Field label="Agreement Date"><input type="date" className={inputClass} value={form.agreementDate} onChange={(e) => update({ agreementDate: e.target.value })} /></Field>
            <Field label="Tender No."><input className={inputClass} value={form.tenderNumber} onChange={(e) => update({ tenderNumber: e.target.value })} /></Field>
            <Field label="Department"><input className={inputClass} value={form.department} onChange={(e) => update({ department: e.target.value })} /></Field>
            <Field label="Division"><input className={inputClass} value={form.division} onChange={(e) => update({ division: e.target.value })} /></Field>
            <Field label="Sub Division"><input className={inputClass} value={form.subDivision} onChange={(e) => update({ subDivision: e.target.value })} /></Field>
            <Field label="Client Engineer"><input className={inputClass} value={form.clientEngineer} onChange={(e) => update({ clientEngineer: e.target.value })} /></Field>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Value & Schedule</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Field label="Contract Value">
              <input type="number" min={0} step="0.01" className={inputClass} value={form.contractValue} onChange={(e) => update({ contractValue: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Estimate Amount">
              <input type="number" min={0} step="0.01" className={inputClass} value={form.estimateAmount} onChange={(e) => update({ estimateAmount: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Defect Liability Period"><input placeholder="e.g. 12 Months" className={inputClass} value={form.defectLiabilityPeriod} onChange={(e) => update({ defectLiabilityPeriod: e.target.value })} /></Field>
            <Field label="Work Start Date"><input type="date" className={inputClass} value={form.workStartDate} onChange={(e) => update({ workStartDate: e.target.value })} /></Field>
            <Field label="Completion Date"><input type="date" className={inputClass} value={form.completionDate} onChange={(e) => update({ completionDate: e.target.value })} /></Field>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Statutory Percentages</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Field label="Security Deposit %">
              <input type="number" min={0} step="0.01" className={inputClass} value={form.securityDepositPercent} onChange={(e) => update({ securityDepositPercent: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Performance Guarantee %">
              <input type="number" min={0} step="0.01" className={inputClass} value={form.performanceGuaranteePercent} onChange={(e) => update({ performanceGuaranteePercent: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="GST %">
              <input type="number" min={0} step="0.01" className={inputClass} value={form.gstPercent} onChange={(e) => update({ gstPercent: Number(e.target.value) || 0 })} />
            </Field>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Contract Information"}
          </button>
        </div>
      </form>

      <div className="space-y-4 rounded-xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-700">Documents</h2>
            <p className="mt-1 text-sm text-slate-500">Work Order, Agreement, BOQ, Drawings, Technical Sanction, Administrative Approval, and other contract documents.</p>
          </div>
          <button onClick={() => setShowUpload((v) => !v)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Document
          </button>
        </div>

        {showUpload && (
          <form onSubmit={handleUpload} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
            {uploadError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{uploadError}</div>}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Type</label>
                <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} className="w-full rounded-lg border p-2.5">
                  {CONTRACT_INFO_ATTACHMENT_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">File Name</label>
                <input value={uploadFileName} onChange={(e) => setUploadFileName(e.target.value)} placeholder="e.g. work-order.pdf" className="w-full rounded-lg border p-2.5" />
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

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full">
            <thead className="bg-slate-100">
              <tr><th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3 text-left">File</th><th className="px-4 py-3 text-left">Notes</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-slate-500">No contract documents uploaded yet.</td></tr>
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
    </div>
  );
}
