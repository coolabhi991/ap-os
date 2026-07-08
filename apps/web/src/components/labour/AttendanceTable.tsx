import { Trash2 } from "lucide-react";
import type { LabourAttendance } from "../../services/labour-attendance";
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS } from "../../services/labour-attendance";

interface Props {
  entries?: LabourAttendance[];
  onDelete: (id: string) => void;
}

export default function AttendanceTable({ entries = [], onDelete }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-6 py-4 text-left">Date</th>
            <th className="px-6 py-4 text-left">Worker</th>
            <th className="px-6 py-4 text-left">Project</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-right">OT Hours</th>
            <th className="px-6 py-4 text-right">Wage Amount</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-10 text-center text-slate-500">No attendance records found.</td>
            </tr>
          ) : (
            entries.map((a) => (
              <tr key={a.id} className="border-t hover:bg-slate-50">
                <td className="px-6 py-4 text-slate-600">{a.attendanceDate}</td>
                <td className="px-6 py-4 font-medium">{a.labour?.name ?? "—"}</td>
                <td className="px-6 py-4">{a.project?.name ?? "—"}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${ATTENDANCE_STATUS_COLORS[a.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {ATTENDANCE_STATUS_LABELS[a.status] ?? a.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">{a.overtimeHours}</td>
                <td className="px-6 py-4 text-right font-medium">₹{Number(a.wageAmount).toLocaleString("en-IN")}</td>
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
