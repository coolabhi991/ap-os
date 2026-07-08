import type { Project } from "../../services/projects";
import ProjectHeader from "./ProjectHeader";
import ProjectStats from "./ProjectStats";
import ProjectOverview from "./ProjectOverview";
import ProjectSidebar from "./ProjectSidebar";
import { WorkspaceProvider } from "./WorkspaceContext";

interface ProjectWorkspaceProps {
  project: Project;
}

export default function ProjectWorkspace({ project }: ProjectWorkspaceProps) {
  return (
    <WorkspaceProvider project={project}>
      <div className="space-y-6">
        <ProjectHeader
          name={project.name}
          code={project.code}
          client={project.client}
          status={project.status}
        />

        <ProjectStats
          contractValue={Number(project.budget)}
          progress={72}
          manager={project.manager}
          startDate={project.startDate}
          endDate={project.endDate}
        />

        <div className="flex flex-col gap-6 xl:flex-row">
          <ProjectSidebar />
          <ProjectOverview project={project} />
        </div>
      </div>
    </WorkspaceProvider>
  );
}
