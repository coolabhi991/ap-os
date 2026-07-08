import { useEffect, useState } from "react";
import { Plus, Download, LayoutDashboard, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import MaterialIssueFilters from "../../components/material-issues/MaterialIssueFilters";
import MaterialIssueTable from "../../components/material-issues/MaterialIssueTable";

import { getMaterialIssues, deleteMaterialIssue, exportMaterialIssuesCSV } from "../../services/material-issues";
import type { MaterialIssue } from "../../services/material-issues";
import { getProjects } from "../../services/projects";
import { getInventoryItems } from "../../services/inventory";

export default function MaterialIssues() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<MaterialIssue[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [materials, setMaterials] = useState<{ id: string; itemName: string }[]>([]);

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getInventoryItems({ limit: 200 }).then((r) => setMaterials(r.data)).catch(() => {});
  }, []);

  const query = {
    search: search || undefined,
    projectId: projectFilter || undefined,
    inventoryId: materialFilter || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getMaterialIssues(query);
      setIssues(result.data);
    } catch {
      setError("Failed to load material issues.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, projectFilter, materialFilter, fromDate, toDate]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this material issue? Stock already deducted will not be restored.")) return;
    try {
      await deleteMaterialIssue(id);
      setIssues((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete material issue.");
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportMaterialIssuesCSV(query);
    } catch {
      alert("Failed to export material issues.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Material Issues</h1>
            <p className="mt-2 text-slate-500">Issue materials from inventory to projects and track consumption.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/material-issues/reports")} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50">
              <BarChart3 size={18} /> Reports
            </button>
            <button onClick={() => navigate("/material-issues/dashboard")} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50">
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50 disabled:opacity-60">
              <Download size={18} /> {exporting ? "Exporting..." : "Export"}
            </button>
            <button onClick={() => navigate("/material-issues/new")} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
              <Plus size={18} /> New Issue
            </button>
          </div>
        </div>

        <MaterialIssueFilters
          search={search} onSearchChange={setSearch}
          projectFilter={projectFilter} onProjectChange={setProjectFilter} projects={projects}
          materialFilter={materialFilter} onMaterialChange={setMaterialFilter} materials={materials}
          fromDate={fromDate} onFromDateChange={setFromDate}
          toDate={toDate} onToDateChange={setToDate}
        />

        {loading && <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}
        {!loading && !error && (
          <MaterialIssueTable
            issues={issues}
            onView={(id) => navigate(`/material-issues/${id}`)}
            onEdit={(id) => navigate(`/material-issues/${id}/edit`)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </Layout>
  );
}
