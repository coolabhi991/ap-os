import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import ProjectForm from "../../components/projects/ProjectForm";
import type { ProjectFormData } from "../../services/projects";

import { createProject } from "../../services/projects";

export default function AddProject() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      setSaving(true);
      setError(null);
      await createProject(data);
      navigate("/projects");
    } catch {
      setError("Failed to create project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Add Project</h1>
          <p className="mt-2 text-slate-500">Create a new construction project.</p>
        </div>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>
        )}
        <ProjectForm onSubmit={handleSubmit} saving={saving} />
      </div>
    </Layout>
  );
}