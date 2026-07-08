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
          code={project.code ?? ""}
          client={project.client?.name ?? ""}
          status={project.status}
        />

        <ProjectStats
          contractValue={Number(project.contractValue)}
          progress={project.progress}
          manager={project.manager ?? ""}
          startDate={project.startDate?.slice(0, 10) ?? ""}
          endDate={project.endDate?.slice(0, 10) ?? ""}
        />

        <div className="flex flex-col gap-6 xl:flex-row">
          <ProjectSidebar />
          <ProjectOverview project={project} />
        </div>
      </div>
    </WorkspaceProvider>
  );
}
