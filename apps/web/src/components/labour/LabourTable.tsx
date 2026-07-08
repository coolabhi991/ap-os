import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Labour } from "../../services/labour";
import { LABOUR_CATEGORY_LABELS } from "../../services/labour";

interface Props {
  labours?: Labour[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function LabourTable({ labours = [], onView, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-6 py-4 text-left">Name</th>
            <th className="px-6 py-4 text-left">Category</th>
            <th className="px-6 py-4 text-left">Project</th>
            <th className="px-6 py-4 text-left">Contractor</th>
            <th className="px-6 py-4 text-left">Group</th>
            <th className="px-6 py-4 text-right">Daily Wage</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {labours.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-10 text-center text-slate-500">No labour records found.</td>
            </tr>
          ) : (
            labours.map((l) => (
              <tr key={l.id} className="border-t hover:bg-slate-50">
                <td className="px-6 py-4 font-medium">{l.name}</td>
                <td className="px-6 py-4 text-slate-600">{LABOUR_CATEGORY_LABELS[l.category] ?? l.category}</td>
                <td className="px-6 py-4">{l.project?.name ?? "—"}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{l.contractor?.name ?? "—"}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{l.group?.name ?? "—"}</td>
                <td className="px-6 py-4 text-right font-medium">
                  {l.currentWageRate ? `₹${Number(l.currentWageRate.dailyWage).toLocaleString("en-IN")}` : "—"}
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${l.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-4">
                    <button onClick={() => onView(l.id)}><Eye size={18} className="text-blue-600" /></button>
                    <button onClick={() => onEdit(l.id)}><Pencil size={18} className="text-green-600" /></button>
                    <button onClick={() => onDelete(l.id)}><Trash2 size={18} className="text-red-600" /></button>
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
