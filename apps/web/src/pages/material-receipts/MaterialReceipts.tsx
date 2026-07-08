import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import MaterialReceiptFilters from "../../components/material-receipts/MaterialReceiptFilters";
import MaterialReceiptTable from "../../components/material-receipts/MaterialReceiptTable";

import { getMaterialReceipts, deleteMaterialReceipt } from "../../services/material-receipts";
import { getProjects } from "../../services/projects";
import type { MaterialReceipt } from "../../services/material-receipts";

export default function MaterialReceipts() {
  const navigate = useNavigate();
  const [mrs, setMRs] = useState<MaterialReceipt[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getMaterialReceipts({
        search: search || undefined,
        status: statusFilter || undefined,
        projectId: projectFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setMRs(result.data);
    } catch {
      setError("Failed to load material receipts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, statusFilter, projectFilter, fromDate, toDate]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this material receipt?")) return;
    try {
      await deleteMaterialReceipt(id);
      setMRs((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert("Failed to delete material receipt.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Material Receipts</h1>
            <p className="mt-2 text-slate-500">Record materials received against issued purchase orders.</p>
          </div>
          <button
            onClick={() => navigate("/material-receipts/new")}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            <Plus size={18} /> New Receipt
          </button>
        </div>

        <MaterialReceiptFilters
          search={search} onSearchChange={setSearch}
          statusFilter={statusFilter} onStatusChange={setStatusFilter}
          projectFilter={projectFilter} onProjectChange={setProjectFilter}
          projects={projects}
          fromDate={fromDate} onFromDateChange={setFromDate}
          toDate={toDate} onToDateChange={setToDate}
        />

        {loading && <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}
        {!loading && !error && (
          <MaterialReceiptTable
            mrs={mrs}
            onView={(id) => navigate(`/material-receipts/${id}`)}
            onEdit={(id) => navigate(`/material-receipts/${id}/edit`)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </Layout>
  );
}
