import { useParams } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import ProjectWorkspace from "../../components/project-workspace/ProjectWorkspace";
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
      <ProjectWorkspace project={project} />
    </Layout>
  );
}