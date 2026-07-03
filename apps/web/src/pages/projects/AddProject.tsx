import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import ProjectForm from "../../components/projects/ProjectForm";
import type { ProjectFormData } from "../../components/projects/ProjectForm";

import { createProject } from "../../services/projects";

export default function AddProject() {
  const navigate = useNavigate();

  const handleSubmit = (data: ProjectFormData) => {
    createProject({
      name: data.name,
      code: data.code,
      client: data.client,
      projectType: data.projectType,
      budget: data.budget,
      manager: data.manager,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      description: data.description,
    });

    navigate("/projects");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Add Project
          </h1>

          <p className="mt-2 text-slate-500">
            Create a new construction project.
          </p>
        </div>

        <ProjectForm onSubmit={handleSubmit} />
      </div>
    </Layout>
  );
}