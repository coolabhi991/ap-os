import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInventoryItems, INVENTORY_STATUS_LABELS, INVENTORY_STATUS_COLORS } from "../../../services/inventory";
import type { InventoryItem } from "../../../services/inventory";
import { getMaterialIssues } from "../../../services/material-issues";
import type { MaterialIssue } from "../../../services/material-issues";
import type { Project } from "../../../services/projects";

export default function InventoryTab({ project }: { project: Project }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [issues, setIssues] = useState<MaterialIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getInventoryItems({ projectId: project.id, page: 1, limit: 10 }),
      getMaterialIssues({ projectId: project.id, page: 1, limit: 10, sortBy: "issuedDate", sortOrder: "desc" }),
    ])
      .then(([invRes, issueRes]) => {
        setItems(invRes.data);
        setIssues(issueRes.data);
      })
      .catch(() => setError("Failed to load inventory data."))
      .finally(() => setLoading(false));
  }, [project.id]);

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Inventory</h2>
          <button onClick={() => navigate("/inventory")} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Open Module</button>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="bg-slate-100"><tr><th className="px-4 py-3 text-left">Item</th><th className="px-4 py-3 text-right">Current Stock</th><th className="px-4 py-3 text-right">Reorder Level</th><th className="px-4 py-3 text-left">Status</th></tr></thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={4} className="py-10 text-center text-slate-500">No inventory items for this project yet.</td></tr>
              ) : items.map((i) => (
                <tr key={i.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => navigate(`/inventory/${i.id}`)}>
                  <td className="px-4 py-3">{i.itemName}</td>
                  <td className="px-4 py-3 text-right">{i.currentStock} {i.unit}</td>
                  <td className="px-4 py-3 text-right">{i.reorderLevel} {i.unit}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${INVENTORY_STATUS_COLORS[i.status]}`}>{INVENTORY_STATUS_LABELS[i.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Recent Material Issues</h2>
          <button onClick={() => navigate("/material-issues")} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Open Module</button>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="bg-slate-100"><tr><th className="px-4 py-3 text-left">Issue #</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Item</th><th className="px-4 py-3 text-right">Quantity</th></tr></thead>
            <tbody>
              {issues.length === 0 ? (
                <tr><td colSpan={4} className="py-10 text-center text-slate-500">No material issues for this project yet.</td></tr>
              ) : issues.map((mi) => (
                <tr key={mi.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => navigate(`/material-issues/${mi.id}`)}>
                  <td className="px-4 py-3">{mi.issueNumber}</td>
                  <td className="px-4 py-3">{mi.issuedDate}</td>
                  <td className="px-4 py-3">{mi.itemName}</td>
                  <td className="px-4 py-3 text-right">{mi.quantity} {mi.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
