import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getDocumentsByVendor, createDocument, deleteDocument, VENDOR_ATTACHMENT_TYPE_OPTIONS, DOCUMENT_TYPE_LABELS } from "../../../services/documents";
import type { ProjectDocument } from "../../../services/documents";

export default function VendorDocumentsTab({ vendorId }: { vendorId: string }) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState("CONTRACT");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadFileUrl, setUploadFileUrl] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    setLoading(true);
    getDocumentsByVendor(vendorId).then(setDocuments).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, [vendorId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim() && !uploadFileUrl.trim()) {
      setUploadError("Either a file name or file URL is required.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      await createDocument({ vendorId, documentType: uploadType, fileName: uploadFileName, fileUrl: uploadFileUrl, notes: uploadNotes });
      setUploadFileName("");
      setUploadFileUrl("");
      setUploadNotes("");
      setShowUpload(false);
      load();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to add document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this document?")) return;
    await deleteDocument(id);
    load();
  };

  if (loading) return <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-700">Vendor Documents</h2>
        <button onClick={() => setShowUpload((v) => !v)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Document
        </button>
      </div>

      {showUpload && (
        <form onSubmit={handleUpload} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {uploadError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{uploadError}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} className="w-full rounded-lg border p-2.5">
                {VENDOR_ATTACHMENT_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">File Name</label>
              <input value={uploadFileName} onChange={(e) => setUploadFileName(e.target.value)} placeholder="e.g. vendor-agreement.pdf" className="w-full rounded-lg border p-2.5" />
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
              <tr><td colSpan={4} className="py-8 text-center text-slate-500">No documents uploaded yet.</td></tr>
            ) : (
              documents.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-4 py-3">{DOCUMENT_TYPE_LABELS[d.documentType] ?? d.documentType}</td>
                  <td className="px-4 py-3">
                    {d.fileUrl ? <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{d.fileName || d.fileUrl}</a> : d.fileName || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{d.notes || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(d.id)} className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
