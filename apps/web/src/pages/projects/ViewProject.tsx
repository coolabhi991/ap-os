import { useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import ProjectOverview from "../../components/projects/ProjectOverview";

import { getProject } from "../../services/projects";

export default function ViewProject() {
  const { id } = useParams();

  const project = getProject(Number(id));

  if (!project) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">
            Project Not Found
          </h1>

          <p className="mt-2 text-slate-500">
            This project does not exist.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ProjectOverview
        name={project.name}
        code={project.code}
        client={project.client}
        manager={project.manager}
        status={project.status}
        contractValue={Number(project.budget)}
        spent={18.4}
        progress={68}
        startDate={project.startDate}
        endDate={project.endDate}
      />
    </Layout>
  );
}