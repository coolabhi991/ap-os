import { useEffect, useState } from "react";
import { Plus, Download, LayoutDashboard, BarChart3, Users2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import LabourFilters from "../../components/labour/LabourFilters";
import LabourTable from "../../components/labour/LabourTable";

import { getLabourList, deleteLabour, exportLabourCSV } from "../../services/labour";
import type { Labour as LabourType } from "../../services/labour";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";
import { getLabourGroups } from "../../services/labour-groups";

export default function Labour() {
  const navigate = useNavigate();
  const [labours, setLabours] = useState<LabourType[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [contractors, setContractors] = useState<{ id: string; name: string }[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [contractorFilter, setContractorFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getVendors({ limit: 100, category: "Labour" }).then((r) => setContractors(r.data)).catch(() => {});
    getLabourGroups(false).then(setGroups).catch(() => {});
  }, []);

  const query = {
    search: search || undefined,
    projectId: projectFilter || undefined,
    contractorId: contractorFilter || undefined,
    groupId: groupFilter || undefined,
    category: categoryFilter || undefined,
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getLabourList(query);
      setLabours(result.data);
    } catch {
      setError("Failed to load labour.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, projectFilter, contractorFilter, groupFilter, categoryFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this labour record?")) return;
    try {
      await deleteLabour(id);
      setLabours((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete labour.");
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportLabourCSV(query);
    } catch {
      alert("Failed to export labour.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Labour Master</h1>
            <p className="mt-2 text-slate-500">Manage workers, contractors, groups, and wage rates.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => navigate("/labour/groups")} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50">
              <Users2 size={18} /> Groups
            </button>
            <button onClick={() => navigate("/labour/reports")} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50">
              <BarChart3 size={18} /> Reports
            </button>
            <button onClick={() => navigate("/labour/dashboard")} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50">
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50 disabled:opacity-60">
              <Download size={18} /> {exporting ? "Exporting..." : "Export"}
            </button>
            <button onClick={() => navigate("/labour/new")} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
              <Plus size={18} /> New Worker
            </button>
          </div>
        </div>

        <LabourFilters
          search={search} onSearchChange={setSearch}
          projectFilter={projectFilter} onProjectChange={setProjectFilter} projects={projects}
          contractorFilter={contractorFilter} onContractorChange={setContractorFilter} contractors={contractors}
          groupFilter={groupFilter} onGroupChange={setGroupFilter} groups={groups}
          categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter}
        />

        {loading && <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}
        {!loading && !error && (
          <LabourTable
            labours={labours}
            onView={(id) => navigate(`/labour/${id}`)}
            onEdit={(id) => navigate(`/labour/${id}/edit`)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </Layout>
  );
}
