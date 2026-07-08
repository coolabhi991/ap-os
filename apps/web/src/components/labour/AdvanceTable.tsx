import { Trash2 } from "lucide-react";
import type { LabourAdvance } from "../../services/labour-advances";
import { ADVANCE_MODE_LABELS } from "../../services/labour-advances";

interface Props {
  advances?: LabourAdvance[];
  onDelete: (id: string) => void;
}

export default function AdvanceTable({ advances = [], onDelete }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-6 py-4 text-left">Date</th>
            <th className="px-6 py-4 text-left">Worker</th>
            <th className="px-6 py-4 text-left">Project</th>
            <th className="px-6 py-4 text-right">Amount</th>
            <th className="px-6 py-4 text-left">Mode</th>
            <th className="px-6 py-4 text-left">Remarks</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {advances.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-10 text-center text-slate-500">No advances found.</td>
            </tr>
          ) : (
            advances.map((a) => (
              <tr key={a.id} className="border-t hover:bg-slate-50">
                <td className="px-6 py-4 text-slate-600">{a.advanceDate}</td>
                <td className="px-6 py-4 font-medium">{a.labour?.name ?? "—"}</td>
                <td className="px-6 py-4">{a.project?.name ?? "—"}</td>
                <td className="px-6 py-4 text-right font-medium">₹{Number(a.amount).toLocaleString("en-IN")}</td>
                <td className="px-6 py-4">{ADVANCE_MODE_LABELS[a.mode] ?? a.mode}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{a.remarks || "—"}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <button onClick={() => onDelete(a.id)}><Trash2 size={18} className="text-red-600" /></button>
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
