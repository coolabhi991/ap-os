import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getSubWorksBySite, createSubWork, updateSubWork, deleteSubWork } from "../../../services/sub-works";
import type { SubWork, SubWorkFormData } from "../../../services/sub-works";
import { SUBWORK_STATUS_LABELS, SUBWORK_STATUS_COLORS } from "../../../services/sub-works";
import type { Site } from "../../../services/sites";
import SubWorkFormModal from "../SubWorkFormModal";
import LoadingState from "../../ui/LoadingState";
import { formatCurrency as inr } from "../../../lib/utils";
import EmptyTableRow from "../../ui/EmptyTableRow";


export default function SubWorksTab({ site }: { site: Site }) {
  const [subWorks, setSubWorks] = useState<SubWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SubWork | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getSubWorksBySite(site.id)
      .then(setSubWorks)
      .catch(() => setError("Failed to load sub works."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [site.id]);

  const handleSubmit = async (data: SubWorkFormData) => {
    setSaving(true);
    try {
      if (editing) await updateSubWork(editing.id, data);
      else await createSubWork(data);
      setShowModal(false);
      setEditing(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save sub work.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this sub work?")) return;
    await deleteSubWork(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Sub Works</h2>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Add Sub Work
        </button>
      </div>

      {loading && <LoadingState />}
      {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Physical Progress</th>
                <th className="px-4 py-3 text-right">Total Budget</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subWorks.length === 0 ? (
                <EmptyTableRow colSpan={5}>No sub works yet for this site.</EmptyTableRow>
              ) : (
                subWorks.map((sw) => (
                  <tr key={sw.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{sw.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${SUBWORK_STATUS_COLORS[sw.status]}`}>{SUBWORK_STATUS_LABELS[sw.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-right">{sw.physicalProgress}%</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(sw.totalBudget)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditing(sw); setShowModal(true); }} className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
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

      {showModal && (
        <SubWorkFormModal
          siteId={site.id}
          initialData={editing ?? undefined}
          onSubmit={handleSubmit}
          onClose={() => { setShowModal(false); setEditing(null); }}
          saving={saving}
        />
      )}
    </div>
  );
}
