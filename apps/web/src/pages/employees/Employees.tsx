import { useEffect, useState } from "react";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import LoadingState from "../../components/ui/LoadingState";
import EmptyTableRow from "../../components/ui/EmptyTableRow";
import { getEmployees, deleteEmployee, EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from "../../services/employees";
import type { Employee } from "../../services/employees";

export default function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getEmployees({ search: search || undefined, status: statusFilter || undefined, limit: 100 });
      setEmployees(result.data);
    } catch {
      setError("Failed to load employees. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this employee?")) return;
    try {
      const result = await deleteEmployee(id);
      if (!result.deleted) alert(result.message);
      load();
    } catch {
      alert("Failed to delete employee.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
            <p className="mt-2 text-slate-500">Internal staff for financial tracking — salary, site advances, and personal advances.</p>
          </div>
          <button onClick={() => navigate("/employees/new")} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
            <Plus size={18} /> New Employee
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, mobile, designation..."
            className="min-w-[240px] flex-1 rounded-lg border p-2.5"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border p-2.5">
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {loading && <LoadingState label="Loading employees..." />}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

        {!loading && !error && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-left">Designation</th>
                  <th className="px-6 py-4 text-left">Department</th>
                  <th className="px-6 py-4 text-left">Mobile</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <EmptyTableRow colSpan={6}>No employees found.</EmptyTableRow>
                ) : (
                  employees.map((e) => (
                    <tr key={e.id} className="border-t hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium">{e.name}</td>
                      <td className="px-6 py-4">{e.designation || "—"}</td>
                      <td className="px-6 py-4">{e.department || "—"}</td>
                      <td className="px-6 py-4">{e.mobile || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${EMPLOYEE_STATUS_COLORS[e.status]}`}>
                          {EMPLOYEE_STATUS_LABELS[e.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-4">
                          <button onClick={() => navigate(`/employees/${e.id}`)}><Eye size={18} className="text-blue-600" /></button>
                          <button onClick={() => navigate(`/employees/${e.id}/edit`)}><Pencil size={18} className="text-green-600" /></button>
                          <button onClick={() => handleDelete(e.id)}><Trash2 size={18} className="text-red-600" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
