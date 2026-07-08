import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import ProjectForm from "../../components/projects/ProjectForm";
import type { ProjectFormData } from "../../services/projects";

import { getProject, updateProject } from "../../services/projects";

export default function EditProject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<Partial<ProjectFormData> | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getProject(id)
      .then((project) => {
        setInitialData({
          name: project.name,
          code: project.code ?? "",
          clientName: project.client?.name ?? "",
          projectTypeName: project.projectType?.name ?? "",
          contractValue: project.contractValue,
          manager: project.manager ?? "",
          startDate: project.startDate?.slice(0, 10) ?? "",
          endDate: project.endDate?.slice(0, 10) ?? "",
          status: project.status,
          description: project.description ?? "",
          location: project.location ?? "",
        });
      })
      .catch(() => setError("Failed to load project."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: ProjectFormData) => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      await updateProject(id, data);
      navigate("/projects");
    } catch {
      setError("Failed to update project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Project</h1>
          <p className="mt-2 text-slate-500">Update project information.</p>
        </div>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>
        )}
        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow">Loading project...</div>
        ) : (
          <ProjectForm initialData={initialData} onSubmit={handleSubmit} saving={saving} />
        )}
      </div>
    </Layout>
  );
}