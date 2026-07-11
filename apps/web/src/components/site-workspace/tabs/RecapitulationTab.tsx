import { useEffect, useState } from "react";
import { History, Save } from "lucide-react";
import {
  getSiteRecapLive,
  listSiteRecapRevisions,
  createSiteRecapRevision,
} from "../../../services/site-control-center";
import type { SiteRecapLive, SiteRecapRevision } from "../../../services/site-control-center";
import type { Site } from "../../../services/sites";

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

function RecapSnapshotView({ snapshot }: { snapshot: SiteRecapLive }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Budget</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{inr(snapshot.budget)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Actual</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{inr(snapshot.actual)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Difference</p>
          <p className={`mt-1 text-lg font-bold ${Number(snapshot.difference) < 0 ? "text-red-600" : "text-emerald-600"}`}>{inr(snapshot.difference)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Physical / Financial Progress</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{snapshot.physicalProgress}% / {snapshot.financialProgress}%</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Sub Work</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Budget</th>
              <th className="px-4 py-3 text-right">Actual</th>
              <th className="px-4 py-3 text-right">Difference</th>
              <th className="px-4 py-3 text-right">Physical %</th>
              <th className="px-4 py-3 text-right">Financial %</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.subWorks.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-500">No Sub Works yet.</td></tr>
            ) : (
              snapshot.subWorks.map((sw) => (
                <tr key={sw.subWorkId} className="border-t">
                  <td className="px-4 py-3 font-medium">{sw.name}</td>
                  <td className="px-4 py-3">{sw.status}</td>
                  <td className="px-4 py-3 text-right">{inr(sw.budget)}</td>
                  <td className="px-4 py-3 text-right">{inr(sw.actual)}</td>
                  <td className={`px-4 py-3 text-right ${Number(sw.difference) < 0 ? "text-red-600" : "text-emerald-600"}`}>{inr(sw.difference)}</td>
                  <td className="px-4 py-3 text-right">{sw.physicalProgress}%</td>
                  <td className="px-4 py-3 text-right">{sw.financialProgress}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function RecapitulationTab({ site }: { site: Site }) {
  const [live, setLive] = useState<SiteRecapLive | null>(null);
  const [revisions, setRevisions] = useState<SiteRecapRevision[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<SiteRecapRevision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getSiteRecapLive(site.id), listSiteRecapRevisions(site.id)])
      .then(([liveData, revisionData]) => {
        setLive(liveData);
        setRevisions(revisionData);
      })
      .catch(() => setError("Failed to load recapitulation sheet."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [site.id]);

  const handleSaveRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createSiteRecapRevision(site.id, { label: label || undefined, notes: notes || undefined });
      setLabel("");
      setNotes("");
      setShowSaveForm(false);
      load();
    } catch {
      alert("Failed to save recap revision.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>;
  if (error || !live) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  const currentRevision = revisions.find((r) => r.isCurrent);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Recapitulation Sheet</h2>
          <p className="text-sm text-slate-500">
            {currentRevision ? `Current revision: #${currentRevision.revisionNo}${currentRevision.label ? ` — ${currentRevision.label}` : ""}` : "No saved revision yet — showing live figures."}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory((v) => !v)} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
            <History size={16} /> Revision History ({revisions.length})
          </button>
          <button onClick={() => setShowSaveForm((v) => !v)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            <Save size={16} /> Save as New Revision
          </button>
        </div>
      </div>

      {showSaveForm && (
        <form onSubmit={handleSaveRevision} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Freezes the current live figures as a new revision. Existing revisions are never overwritten.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Label</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. As per site inspection" className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border p-2.5" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowSaveForm(false)} className="rounded-lg border px-5 py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Save Revision"}
            </button>
          </div>
        </form>
      )}

      {showHistory && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Revision</th>
                <th className="px-4 py-3 text-left">Label</th>
                <th className="px-4 py-3 text-left">Saved By</th>
                <th className="px-4 py-3 text-left">Saved At</th>
                <th className="px-4 py-3 text-left">Current</th>
                <th className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {revisions.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500">No revisions saved yet.</td></tr>
              ) : (
                revisions.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3 font-medium">#{r.revisionNo}</td>
                    <td className="px-4 py-3">{r.label || "—"}</td>
                    <td className="px-4 py-3">{r.createdByName || "—"}</td>
                    <td className="px-4 py-3">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{r.isCurrent && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Current</span>}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelectedRevision(r)} className="text-blue-600 hover:underline">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedRevision ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Revision #{selectedRevision.revisionNo}{selectedRevision.label ? ` — ${selectedRevision.label}` : ""}</h3>
            <button onClick={() => setSelectedRevision(null)} className="text-sm text-blue-600 hover:underline">Back to Live</button>
          </div>
          <RecapSnapshotView snapshot={selectedRevision.snapshot} />
        </div>
      ) : (
        <RecapSnapshotView snapshot={live} />
      )}
    </div>
  );
}
