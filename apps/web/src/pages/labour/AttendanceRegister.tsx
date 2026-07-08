import { useEffect, useState } from "react";
import { Plus, Download } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import AttendanceFilters from "../../components/labour/AttendanceFilters";
import AttendanceTable from "../../components/labour/AttendanceTable";

import { getLabourAttendanceList, deleteLabourAttendance, exportLabourAttendanceCSV } from "../../services/labour-attendance";
import type { LabourAttendance } from "../../services/labour-attendance";
import { getProjects } from "../../services/projects";

export default function AttendanceRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const labourId = searchParams.get("labourId") ?? "";

  const [entries, setEntries] = useState<LabourAttendance[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
  }, []);

  const query = {
    search: search || undefined,
    projectId: projectFilter || undefined,
    labourId: labourId || undefined,
    status: statusFilter || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getLabourAttendanceList(query);
      setEntries(result.data);
    } catch {
      setError("Failed to load attendance register.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, projectFilter, statusFilter, fromDate, toDate, labourId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this attendance record?")) return;
    try {
      await deleteLabourAttendance(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete attendance record.");
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportLabourAttendanceCSV(query);
    } catch {
      alert("Failed to export attendance register.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Attendance Register</h1>
            <p className="mt-2 text-slate-500">Daily attendance history across projects and workers.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50 disabled:opacity-60">
              <Download size={18} /> {exporting ? "Exporting..." : "Export"}
            </button>
            <button onClick={() => navigate("/labour/attendance/mark")} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
              <Plus size={18} /> Mark Attendance
            </button>
          </div>
        </div>

        <AttendanceFilters
          search={search} onSearchChange={setSearch}
          projectFilter={projectFilter} onProjectChange={setProjectFilter} projects={projects}
          statusFilter={statusFilter} onStatusChange={setStatusFilter}
          fromDate={fromDate} onFromDateChange={setFromDate}
          toDate={toDate} onToDateChange={setToDate}
        />

        {loading && <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}
        {!loading && !error && <AttendanceTable entries={entries} onDelete={handleDelete} />}
      </div>
    </Layout>
  );
}
