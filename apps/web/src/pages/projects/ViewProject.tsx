import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import ProjectControlCenter from "../../components/project-control-center/ProjectControlCenter";
import { getProject } from "../../services/projects";
import type { Project } from "../../services/projects";

export default function ViewProject() {
  const { id } = useParams<{ id: string }>();
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
        <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">
          Loading project control center...
        </div>
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
      <ProjectControlCenter project={project} />
    </Layout>
  );
}
