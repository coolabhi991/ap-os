import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { getSubWorks, deleteSubWork, reorderSubWorks, SUBWORK_STATUS_LABELS, SUBWORK_STATUS_COLORS } from "../../../services/sub-works";
import type { SubWork } from "../../../services/sub-works";
import type { Project } from "../../../services/projects";
import SubWorkFormModal from "../SubWorkFormModal";
import RecapSheet from "../RecapSheet";

export default function SubWorksTab({ project }: { project: Project }) {
  const [subWorks, setSubWorks] = useState<SubWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<SubWork | "new" | null>(null);
  const [recapId, setRecapId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getSubWorks(project.id)
      .then(setSubWorks)
      .catch(() => setError("Failed to load sub works."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [project.id]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this sub work? Any tagged transactions will be un-tagged, not deleted.")) return;
    await deleteSubWork(id);
    load();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= subWorks.length) return;
    const reordered = [...subWorks];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setSubWorks(reordered);
    await reorderSubWorks(project.id, reordered.map((s, i) => ({ id: s.id, sortOrder: i })));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Sub Works</h2>
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Add Sub Work
        </button>
      </div>

      {loading && <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
      {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-right">Budget</th>
                <th className="px-4 py-3 text-left">Start</th>
                <th className="px-4 py-3 text-left">End</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Physical Progress</th>
                <th className="px-4 py-3 text-left">Remarks</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subWorks.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-slate-500">No sub works yet. Add one to start tracking budget vs actual.</td></tr>
              ) : (
                subWorks.map((sw, i) => (
                  <tr key={sw.id} className="border-t">
                    <td className="px-4 py-3">
                      <button onClick={() => setRecapId(sw.id)} className="font-medium text-blue-600 hover:underline">{sw.name}</button>
                    </td>
                    <td className="px-4 py-3 text-right">₹{Number(sw.budgetAmount).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">{sw.startDate || "—"}</td>
                    <td className="px-4 py-3">{sw.endDate || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${SUBWORK_STATUS_COLORS[sw.status]}`}>
                        {SUBWORK_STATUS_LABELS[sw.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{sw.physicalProgress}%</td>
                    <td className="px-4 py-3 text-slate-500">{sw.remarks || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-30">
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button onClick={() => move(i, 1)} disabled={i === subWorks.length - 1} className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-30">
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditing(sw)} className="rounded p-1.5 hover:bg-slate-100">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(sw.id)} className="rounded p-1.5 text-red-600 hover:bg-red-50">
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
      )}

      {editing && (
        <SubWorkFormModal
          projectId={project.id}
          initialData={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      {recapId && <RecapSheet subWorkId={recapId} onClose={() => setRecapId(null)} />}
    </div>
  );
}
