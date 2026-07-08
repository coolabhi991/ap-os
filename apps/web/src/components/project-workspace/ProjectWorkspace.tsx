import { useState } from "react";
import type { Project } from "../../services/projects";
import ProjectHeader from "./ProjectHeader";
import ProjectStats from "./ProjectStats";
import ProjectOverview from "./ProjectOverview";
import ProjectSidebar from "./ProjectSidebar";

interface ProjectWorkspaceProps {
  project: Project;
}

export default function ProjectWorkspace({ project }: ProjectWorkspaceProps) {
  const [activeSection, setActiveSection] = useState("Overview");

  return (
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
        <ProjectSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <ProjectOverview
          project={project}
          activeSection={activeSection}
        />
      </div>
    </div>
  );
}
