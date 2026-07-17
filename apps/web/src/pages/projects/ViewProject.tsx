import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil } from "lucide-react";
import Layout from "../../components/layout/Layout";
import { getProject } from "../../services/projects";
import type { Project } from "../../services/projects";
import ProjectWorkspace from "../../components/projects/ProjectWorkspace";
import LoadingState from "../../components/ui/LoadingState";

export default function ViewProject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getProject(id)
      .then(setProject)
      .catch(() => setError("Project not found or failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <LoadingState label="Loading project..." />
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Project Not Found</h1>
          <p className="mt-2 text-slate-500">{error ?? "This project does not exist."}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between rounded-xl bg-white p-6 shadow-sm">
          <div>
            <p className="font-mono text-sm text-blue-600">{project.code || project.id}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{project.name}</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
              {project.client && <span>Client: <strong>{project.client.name}</strong></span>}
              {project.location && <span>Location: <strong>{project.location}</strong></span>}
              {project.manager && <span>Manager: <strong>{project.manager}</strong></span>}
            </div>
          </div>
          <button
            onClick={() => navigate(`/projects/${project.id}/edit`)}
            className="flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <Pencil size={15} /> Edit Project
          </button>
        </div>

        <ProjectWorkspace project={project} />
      </div>
    </Layout>
  );
}
