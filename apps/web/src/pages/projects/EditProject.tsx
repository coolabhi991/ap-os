import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import ProjectForm from "../../components/projects/ProjectForm";
import type { ProjectFormData } from "../../components/projects/ProjectForm";

export default function EditProject() {
  const navigate = useNavigate();

  const initialData: ProjectFormData = {
    name: "Water Supply Project - Nashik",
    code: "WSP-001",
    client: "XYZ Infrastructure Pvt Ltd",
    projectType: "Water Supply",
    budget: "27",
    manager: "Abhijit Patil",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "Running",
    description: "Water Supply Phase III Project",
  };

  const handleSubmit = (data: ProjectFormData) => {
    console.log("Update Project:", data);

    // TODO:
    // await updateProject(data);

    navigate("/projects");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Edit Project
          </h1>

          <p className="mt-2 text-slate-500">
            Update project information.
          </p>
        </div>

        <ProjectForm
          initialData={initialData}
          onSubmit={handleSubmit}
        />
      </div>
    </Layout>
  );
}