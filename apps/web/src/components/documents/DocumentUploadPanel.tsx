import { useEffect, useState } from "react";
import { Plus, Trash2, Eye, Download } from "lucide-react";
import {
  uploadDocument,
  deleteDocument,
  previewDocument,
  downloadDocument,
  DOCUMENT_TYPE_LABELS,
  ACCEPTED_FILE_TYPES,
} from "../../services/documents";
import type { ProjectDocument, DocumentUploadParams } from "../../services/documents";
import LoadingState from "../ui/LoadingState";
import EmptyTableRow from "../ui/EmptyTableRow";

function formatFileSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  title?: string;
  documentTypeOptions: string[];
  fetchDocuments: () => Promise<ProjectDocument[]>;
  // The polymorphic FK fields fixed for this call site (siteId, runningBillId, dprId, ...).
  createParams: Omit<DocumentUploadParams, "documentType" | "notes">;
  // When provided, documents are sectioned into named groups (e.g. Work Order/Drawings/...)
  // instead of one flat table — every documentTypeOptions value must appear in exactly one group.
  groups?: { label: string; types: string[] }[];
}

/**
 * Documents module (Form 58 redesign) — direct file upload (PDF/JPEG/PNG), no File URL field.
 * One reusable panel for every document-attachment surface in the app (Site Workspace, Vendor
 * Ledger, DPR, Running Bill) — "Enter Once, Use Everywhere" applied to the upload UI itself.
 */
function DocumentTable({
  documents,
  busyId,
  onPreview,
  onDownload,
  onDelete,
  emptyMessage = "No documents uploaded yet.",
}: {
  documents: ProjectDocument[];
  busyId: string | null;
  onPreview: (id: string) => void;
  onDownload: (doc: ProjectDocument) => void;
  onDelete: (id: string) => void;
  emptyMessage?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-4 py-3 text-left">Document #</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-left">File</th>
            <th className="px-4 py-3 text-left">Remarks</th>
            <th className="px-4 py-3 text-left">Upload Date</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.length === 0 ? (
            <EmptyTableRow colSpan={6}>{emptyMessage}</EmptyTableRow>
          ) : (
            documents.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="px-4 py-3">{d.documentNumber}</td>
                <td className="px-4 py-3">{DOCUMENT_TYPE_LABELS[d.documentType] ?? d.documentType}</td>
                <td className="px-4 py-3">
                  {d.fileName || "—"}
                  {d.fileSizeBytes > 0 && <span className="ml-2 text-xs text-slate-400">{formatFileSize(d.fileSizeBytes)}</span>}
                </td>
                <td className="px-4 py-3 text-slate-500">{d.notes || "—"}</td>
                <td className="px-4 py-3">{new Date(d.uploadedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    {d.hasFile && (
                      <>
                        <button onClick={() => onPreview(d.id)} disabled={busyId === d.id} title="Preview" className="rounded p-1.5 text-blue-600 hover:bg-blue-50 disabled:opacity-50">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => onDownload(d)} disabled={busyId === d.id} title="Download" className="rounded p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50">
                          <Download className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => onDelete(d.id)} title="Delete" className="rounded p-1.5 text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function DocumentUploadPanel({ title = "Documents", documentTypeOptions, fetchDocuments, createParams, groups }: Props) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState(documentTypeOptions[0] ?? "OTHER");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchDocuments()
      .then(setDocuments)
      .catch(() => setError("Failed to load documents."))
      .finally(() => setLoading(false));
  };

  // fetchDocuments is expected to be a fresh closure per render (it captures the caller's id) —
  // intentionally not in the dependency array, or every render would re-fetch. Callers that need
  // to refetch on a changed id should remount this component (e.g. via a `key` prop).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setFormError("Select a PDF, JPEG, or PNG file to upload.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await uploadDocument(file, { ...createParams, documentType, notes });
      setFile(null);
      setDocumentType(documentTypeOptions[0] ?? "OTHER");
      setNotes("");
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to upload document.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this document?")) return;
    await deleteDocument(id);
    load();
  };

  const handlePreview = async (id: string) => {
    setBusyId(id);
    try {
      await previewDocument(id);
    } catch {
      alert("Failed to open the file.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDownload = async (doc: ProjectDocument) => {
    setBusyId(doc.id);
    try {
      await downloadDocument(doc.id, doc.fileName);
    } catch {
      alert("Failed to download the file.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Upload Document
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {formError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Document Type</label>
              <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="w-full rounded-lg border p-2.5">
                {documentTypeOptions.map((t) => (
                  <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t] ?? t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">File (PDF, JPEG, or PNG)</label>
              <input
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-lg border p-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Remarks</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border p-2.5" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-5 py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      )}

      {loading && <LoadingState />}
      {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

      {!loading && !error && (
        <>
          {groups ? (
            <div className="space-y-5">
              {groups.map((g) => (
                <div key={g.label}>
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">{g.label}</h3>
                  <DocumentTable
                    documents={documents.filter((d) => g.types.includes(d.documentType))}
                    busyId={busyId}
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    emptyMessage={`No ${g.label.toLowerCase()} uploaded yet.`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <DocumentTable documents={documents} busyId={busyId} onPreview={handlePreview} onDownload={handleDownload} onDelete={handleDelete} />
          )}
        </>
      )}
    </div>
  );
}
