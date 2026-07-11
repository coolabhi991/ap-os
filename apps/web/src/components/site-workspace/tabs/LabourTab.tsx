import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLabourAttendanceList, ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS } from "../../../services/labour-attendance";
import type { LabourAttendance } from "../../../services/labour-attendance";
import type { Site } from "../../../services/sites";
import LoadingState from "../../ui/LoadingState";
import { formatCurrency as inr } from "../../../lib/utils";
import EmptyTableRow from "../../ui/EmptyTableRow";


export default function LabourTab({ site }: { site: Site }) {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<LabourAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getLabourAttendanceList({ siteId: site.id, page: 1, limit: 10, sortBy: "attendanceDate", sortOrder: "desc" })
      .then((res) => setAttendance(res.data))
      .catch(() => setError("Failed to load labour attendance."))
      .finally(() => setLoading(false));
  }, [site.id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Labour — Recent Attendance</h2>
        <button onClick={() => navigate("/labour/attendance/mark")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Mark Attendance</button>
      </div>

      {loading && <LoadingState />}
      {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Worker</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Overtime Hrs</th>
                <th className="px-4 py-3 text-right">Wage</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <EmptyTableRow colSpan={5}>No attendance recorded for this site yet.</EmptyTableRow>
              ) : (
                attendance.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="px-4 py-3">{a.attendanceDate}</td>
                    <td className="px-4 py-3">{a.labour?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${ATTENDANCE_STATUS_COLORS[a.status]}`}>{ATTENDANCE_STATUS_LABELS[a.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-right">{a.overtimeHours}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(a.wageAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
