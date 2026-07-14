import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import ProjectFilters from "../../components/projects/ProjectFilters";
import ProjectTable from "../../components/projects/ProjectTable";

import { getProjectExecutiveDashboard, deleteProject } from "../../services/projects";
import type { ProjectDashboardRow } from "../../services/projects";
import LoadingState from "../../components/ui/LoadingState";

export default function Projects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectDashboardRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getProjectExecutiveDashboard();
      setProjects(result);
    } catch {
      setError("Failed to load the Project Executive Dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // The dashboard endpoint returns every Project with its full Site table in one call — search
  // and status filtering happen client-side rather than adding a second round trip.
  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (!term) return true;
      return p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term) || (p.client?.name.toLowerCase().includes(term) ?? false);
    });
  }, [projects, search, statusFilter]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this project?");
    if (!confirmed) return;

    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Failed to delete project.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
            <p className="mt-2 text-slate-500">Executive portfolio view — every Project and Site's cost, payments, and progress at a glance.</p>
          </div>
          <button
            onClick={() => navigate("/projects/new")}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>

        <ProjectFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        {loading && (
          <LoadingState label="Loading Project Executive Dashboard..." />
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <ProjectTable
            projects={filteredProjects}
            onView={(id) => navigate(`/projects/${id}`)}
            onEdit={(id) => navigate(`/projects/${id}/edit`)}
            onDelete={handleDelete}
            onViewSite={(id) => navigate(`/sites/${id}`)}
            onEditSite={(id) => navigate(`/sites/${id}/edit`)}
            onAddSite={(projectId) => navigate(`/projects/${projectId}/sites/new`)}
            onSiteDeleted={load}
          />
        )}
      </div>
    </Layout>
  );
}
