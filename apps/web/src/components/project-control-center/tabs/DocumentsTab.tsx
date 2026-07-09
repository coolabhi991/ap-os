import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getDocuments, createDocument, deleteDocument, DOCUMENT_TYPE_OPTIONS, DOCUMENT_TYPE_LABELS } from "../../../services/documents";
import type { ProjectDocument } from "../../../services/documents";
import type { Project } from "../../../services/projects";

export default function DocumentsTab({ project }: { project: Project }) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [documentType, setDocumentType] = useState("OTHER");
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getDocuments(project.id)
      .then(setDocuments)
      .catch(() => setError("Failed to load documents."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [project.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() && !fileUrl.trim()) {
      setFormError("Either a file name or file URL is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await createDocument({ projectId: project.id, documentType, fileName, fileUrl, notes });
      setDocumentType("OTHER");
      setFileName("");
      setFileUrl("");
      setNotes("");
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add document.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this document?")) return;
    await deleteDocument(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Documents</h2>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Document
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {formError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Document Type</label>
              <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="w-full rounded-lg border p-2.5">
                {DOCUMENT_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">File Name</label>
              <input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="e.g. contract.pdf" className="w-full rounded-lg border p-2.5" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">File URL</label>
              <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="Uploaded file URL (once storage is wired up)" className="w-full rounded-lg border p-2.5" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border p-2.5" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-5 py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      {loading && <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
      {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Document #</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">File</th>
                <th className="px-4 py-3 text-left">Notes</th>
                <th className="px-4 py-3 text-left">Uploaded</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-500">No documents uploaded yet.</td></tr>
              ) : (
                documents.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="px-4 py-3">{d.documentNumber}</td>
                    <td className="px-4 py-3">{DOCUMENT_TYPE_LABELS[d.documentType] ?? d.documentType}</td>
                    <td className="px-4 py-3">
                      {d.fileUrl ? (
                        <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{d.fileName || d.fileUrl}</a>
                      ) : (
                        d.fileName || "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{d.notes || "—"}</td>
                    <td className="px-4 py-3">{new Date(d.uploadedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(d.id)} className="rounded p-1.5 text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
