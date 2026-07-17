import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { getProjectSitesOverview } from "../../../services/projects";
import type { ProjectSiteOverview } from "../../../services/projects";
import { deleteSite, SITE_STATUS_LABELS, SITE_STATUS_COLORS } from "../../../services/sites";
import LoadingState from "../../ui/LoadingState";
import EmptyTableRow from "../../ui/EmptyTableRow";
import { formatDate } from "../../../lib/utils";

function ProgressBadge({ value }: { value: number }) {
  const color = value >= 100 ? "bg-emerald-100 text-emerald-700" : value >= 50 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{value}%</span>;
}

export default function SitesTab({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [sites, setSites] = useState<ProjectSiteOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getProjectSitesOverview(projectId)
      .then(setSites)
      .catch(() => setError("Failed to load sites."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [projectId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this site? Sites with operational records cannot be deleted.")) return;
    try {
      await deleteSite(id);
      load();
    } catch {
      alert("Failed to delete site. It may still have operational records linked to it.");
    }
  };

  if (loading) return <LoadingState label="Loading sites..." />;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Sites</h2>
        <button onClick={() => navigate(`/projects/${projectId}/sites/new`)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Plus size={16} /> Add Site
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Site Name</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Engineer</th>
              <th className="px-4 py-3 text-left">Expected Completion</th>
              <th className="px-4 py-3 text-center">Physical %</th>
              <th className="px-4 py-3 text-center">Financial %</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sites.length === 0 ? (
              <EmptyTableRow colSpan={7}>No sites yet. Add the first site to start operational work.</EmptyTableRow>
            ) : (
              sites.map((s) => (
                <tr key={s.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => navigate(`/sites/${s.id}`)}>
                  <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${SITE_STATUS_COLORS[s.status] ?? "bg-slate-100 text-slate-700"}`}>
                      {SITE_STATUS_LABELS[s.status] ?? s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.engineer || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{s.expectedCompletion ? formatDate(s.expectedCompletion) : "—"}</td>
                  <td className="px-4 py-3 text-center"><ProgressBadge value={s.physicalProgress} /></td>
                  <td className="px-4 py-3 text-center"><ProgressBadge value={s.financialProgress} /></td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2.5">
                      <button onClick={() => navigate(`/sites/${s.id}`)} title="View Site"><Eye size={15} className="text-blue-600" /></button>
                      <button onClick={() => navigate(`/sites/${s.id}/edit`)} title="Edit Site"><Pencil size={15} className="text-emerald-600" /></button>
                      <button onClick={() => handleDelete(s.id)} title="Delete Site"><Trash2 size={15} className="text-red-600" /></button>
                    </div>
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
