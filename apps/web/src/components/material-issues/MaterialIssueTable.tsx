import { Eye, Pencil, Trash2 } from "lucide-react";
import type { MaterialIssue } from "../../services/material-issues";

interface Props {
  issues?: MaterialIssue[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function MaterialIssueTable({ issues = [], onView, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-6 py-4 text-left">Issue No.</th>
            <th className="px-6 py-4 text-left">Date</th>
            <th className="px-6 py-4 text-left">Project</th>
            <th className="px-6 py-4 text-left">Material</th>
            <th className="px-6 py-4 text-right">Quantity</th>
            <th className="px-6 py-4 text-left">Issued To</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {issues.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-10 text-center text-slate-500">No material issues found.</td>
            </tr>
          ) : (
            issues.map((i) => (
              <tr key={i.id} className="border-t hover:bg-slate-50">
                <td className="px-6 py-4 font-mono text-sm font-medium text-blue-700">{i.issueNumber}</td>
                <td className="px-6 py-4 text-slate-600">{i.issuedDate}</td>
                <td className="px-6 py-4">{i.project?.name ?? "—"}</td>
                <td className="px-6 py-4 text-slate-600">{i.itemName}</td>
                <td className="px-6 py-4 text-right font-medium">{Number(i.quantity).toLocaleString("en-IN")} {i.unit}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{i.issuedTo || "—"}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-4">
                    <button onClick={() => onView(i.id)}><Eye size={18} className="text-blue-600" /></button>
                    <button onClick={() => onEdit(i.id)}><Pencil size={18} className="text-green-600" /></button>
                    <button onClick={() => onDelete(i.id)}><Trash2 size={18} className="text-red-600" /></button>
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
