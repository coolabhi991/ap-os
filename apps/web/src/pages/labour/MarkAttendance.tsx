import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import { bulkMarkAttendance, ATTENDANCE_STATUS_OPTIONS, ATTENDANCE_STATUS_LABELS } from "../../services/labour-attendance";
import { getLabourList } from "../../services/labour";
import type { Labour } from "../../services/labour";
import { getProjects } from "../../services/projects";
import { getLabourGroups } from "../../services/labour-groups";
import type { LabourGroup } from "../../services/labour-groups";
import { getSubWorks } from "../../services/sub-works";
import type { SubWork } from "../../services/sub-works";
import { getSites } from "../../services/sites";
import type { Site } from "../../services/sites";

interface RowState {
  labourId: string;
  status: string;
  overtimeHours: number;
}

export default function MarkAttendance() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [groups, setGroups] = useState<LabourGroup[]>([]);
  const [projectId, setProjectId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [sites, setSites] = useState<Site[]>([]);
  const [subWorkId, setSubWorkId] = useState("");
  const [subWorks, setSubWorks] = useState<SubWork[]>([]);
  const [groupId, setGroupId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [labourers, setLabourers] = useState<Labour[]>([]);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [loadingLabour, setLoadingLabour] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ createdCount: number; skipped: Array<{ labourId: string; reason: string }> } | null>(null);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getLabourGroups(false).then(setGroups).catch(() => {});
  }, []);

  useEffect(() => {
    setSubWorkId("");
    if (!projectId) {
      setSubWorks([]);
      return;
    }
    getSubWorks(projectId).then(setSubWorks).catch(() => setSubWorks([]));
  }, [projectId]);

  useEffect(() => {
    setSiteId("");
    if (!projectId) {
      setSites([]);
      return;
    }
    getSites(projectId).then((result) => {
      setSites(result);
      if (result.length === 1) setSiteId(result[0].id);
    }).catch(() => setSites([]));
  }, [projectId]);

  useEffect(() => {
    setLoadingLabour(true);
    getLabourList({ status: "Active", groupId: groupId || undefined, limit: 200 })
      .then((r) => {
        setLabourers(r.data);
        const initial: Record<string, RowState> = {};
        for (const l of r.data) {
          initial[l.id] = { labourId: l.id, status: "PRESENT", overtimeHours: 0 };
        }
        setRows(initial);
      })
      .catch(() => {})
      .finally(() => setLoadingLabour(false));
  }, [groupId]);

  const updateRow = (labourId: string, patch: Partial<RowState>) => {
    setRows((prev) => ({ ...prev, [labourId]: { ...prev[labourId], ...patch } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setError("Select a project.");
      return;
    }
    if (!siteId) {
      setError("Select a site.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setResult(null);
      const entries = Object.values(rows).map((r) => ({ labourId: r.labourId, status: r.status, overtimeHours: r.overtimeHours }));
      const response = await bulkMarkAttendance({ projectId, siteId, subWorkId: subWorkId || undefined, attendanceDate, entries });
      setResult({ createdCount: response.created.length, skipped: response.skipped });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark attendance.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mark Daily Attendance</h1>
          <p className="mt-2 text-slate-500">Mark attendance for a project's workers in one action.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
          {result && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-emerald-700">
              Marked {result.createdCount} worker(s).
              {result.skipped.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-sm text-amber-700">
                  {result.skipped.map((s, i) => <li key={i}>{s.reason}</li>)}
                </ul>
              )}
            </div>
          )}

          <div className="grid gap-6 rounded-xl bg-white p-6 shadow-sm md:grid-cols-5">
            <div>
              <label className="mb-2 block font-medium">Project *</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} required className="w-full rounded-lg border p-3">
                <option value="">Select Project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block font-medium">Site *</label>
              <select value={siteId} onChange={(e) => setSiteId(e.target.value)} disabled={!projectId} required className="w-full rounded-lg border p-3 disabled:bg-slate-50">
                <option value="">Select Site</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block font-medium">Sub Work <span className="font-normal text-slate-400">(optional)</span></label>
              <select value={subWorkId} onChange={(e) => setSubWorkId(e.target.value)} disabled={!projectId} className="w-full rounded-lg border p-3 disabled:bg-slate-50">
                <option value="">No Sub Work</option>
                {subWorks.map((sw) => <option key={sw.id} value={sw.id}>{sw.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block font-medium">Group Filter</label>
              <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="w-full rounded-lg border p-3">
                <option value="">All Active Workers</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block font-medium">Date</label>
              <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="w-full rounded-lg border p-3" />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {loadingLabour ? (
              <p className="p-8 text-center text-slate-500">Loading workers...</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Worker</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Overtime Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {labourers.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-slate-500">No active workers found.</td></tr>
                  ) : (
                    labourers.map((l) => (
                      <tr key={l.id}>
                        <td className="px-4 py-3 font-medium">{l.name}</td>
                        <td className="px-4 py-3 text-slate-500">{l.category}</td>
                        <td className="px-4 py-3">
                          <select
                            value={rows[l.id]?.status ?? "PRESENT"}
                            onChange={(e) => updateRow(l.id, { status: e.target.value })}
                            className="rounded-lg border p-2"
                          >
                            {ATTENDANCE_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{ATTENDANCE_STATUS_LABELS[s]}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min={0}
                            step="0.5"
                            value={rows[l.id]?.overtimeHours ?? 0}
                            onChange={(e) => updateRow(l.id, { overtimeHours: parseFloat(e.target.value) || 0 })}
                            className="w-24 rounded-lg border p-2 text-right"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => navigate("/labour/attendance")} className="rounded-lg border px-6 py-3">Cancel</button>
            <button type="submit" disabled={saving || labourers.length === 0} className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Mark Attendance"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
