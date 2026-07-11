import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import {
  getSiteVisits,
  createSiteVisit,
  updateSiteVisit,
  deleteSiteVisit,
  SITE_VISIT_STATUS_OPTIONS,
  SITE_VISIT_STATUS_LABELS,
  SITE_VISIT_STATUS_COLORS,
} from "../../../services/site-visits";
import type { SiteVisit, SiteVisitFormData, SiteVisitSummary } from "../../../services/site-visits";
import type { Site } from "../../../services/sites";
import LoadingState from "../../ui/LoadingState";
import { todayISO } from "../../../lib/utils";
import EmptyTableRow from "../../ui/EmptyTableRow";

const EMPTY_FORM: Omit<SiteVisitFormData, "siteId"> = {
  visitDate: todayISO(),
  visitedBy: "",
  purpose: "",
  remarks: "",
  photos: [],
  status: "PLANNED",
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function SiteVisitsTab({ site }: { site: Site }) {
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [summary, setSummary] = useState<SiteVisitSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SiteVisit | null>(null);
  const [form, setForm] = useState<Omit<SiteVisitFormData, "siteId">>(EMPTY_FORM);
  const [photosText, setPhotosText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getSiteVisits(site.id)
      .then((res) => {
        setVisits(res.data);
        setSummary(res.summary);
      })
      .catch(() => setError("Failed to load site visits."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [site.id]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPhotosText("");
    setShowForm(true);
  };

  const openEdit = (v: SiteVisit) => {
    setEditing(v);
    setForm({ visitDate: v.visitDate, visitedBy: v.visitedBy, purpose: v.purpose, remarks: v.remarks, photos: v.photos, status: v.status });
    setPhotosText(v.photos.join(", "));
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const photos = photosText.split(",").map((p) => p.trim()).filter(Boolean);
    try {
      if (editing) await updateSiteVisit(editing.id, { ...form, photos });
      else await createSiteVisit({ ...form, photos, siteId: site.id });
      setShowForm(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save site visit.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this site visit?")) return;
    await deleteSiteVisit(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Site Visits</h2>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Log Visit
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Planned Visits" value={summary.totalPlanned} />
          <StatCard label="Completed Visits" value={summary.completed} />
          <StatCard label="Pending Visits" value={summary.pending} />
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">{editing ? "Edit Visit" : "Log Visit"}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Visit Date</label>
              <input type="date" value={form.visitDate} onChange={(e) => setForm((f) => ({ ...f, visitDate: e.target.value }))} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full rounded-lg border p-2.5">
                {SITE_VISIT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{SITE_VISIT_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Visited By</label>
              <input value={form.visitedBy} onChange={(e) => setForm((f) => ({ ...f, visitedBy: e.target.value }))} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Purpose</label>
              <input value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))} className="w-full rounded-lg border p-2.5" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Remarks</label>
              <textarea rows={2} value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} className="w-full rounded-lg border p-2.5" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Photo URLs (comma-separated)</label>
              <input value={photosText} onChange={(e) => setPhotosText(e.target.value)} placeholder="https://..." className="w-full rounded-lg border p-2.5" />
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

      {loading && <LoadingState />}
      {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Visited By</th>
                <th className="px-4 py-3 text-left">Purpose</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Photos</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visits.length === 0 ? (
                <EmptyTableRow colSpan={6}>No site visits logged yet.</EmptyTableRow>
              ) : (
                visits.map((v) => (
                  <tr key={v.id} className="border-t">
                    <td className="px-4 py-3">{v.visitDate}</td>
                    <td className="px-4 py-3">{v.visitedBy || "—"}</td>
                    <td className="px-4 py-3">{v.purpose || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${SITE_VISIT_STATUS_COLORS[v.status]}`}>{SITE_VISIT_STATUS_LABELS[v.status]}</span>
                    </td>
                    <td className="px-4 py-3">{v.photos.length > 0 ? `${v.photos.length} photo(s)` : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(v)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(v.id)} aria-label="Delete" className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
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
