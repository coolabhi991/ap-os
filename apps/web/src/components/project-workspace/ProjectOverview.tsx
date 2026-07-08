import { ClipboardList, LayoutDashboard, Sparkles } from "lucide-react";
import type { Project } from "../../services/projects";
import { useWorkspace } from "./WorkspaceContext";
import { getWorkspaceModuleById } from "./moduleRegistry";
import { overviewNextAction, workspaceQuickActions } from "./data/overviewData";

interface ProjectOverviewProps {
  project: Project;
}

export default function ProjectOverview({ project }: ProjectOverviewProps) {
  const { activeSection, project: workspaceProject } = useWorkspace();
  const currentProject = project ?? workspaceProject;
  const moduleDefinition = getWorkspaceModuleById(activeSection);
  const content = moduleDefinition?.overview ?? {
    title: "Project Summary",
    subtitle: "A high-level pulse of the project health, delivery plan, and control points.",
    highlight: "On track with strong visibility across contract, delivery, and site operations.",
    items: [
      { label: "Project Type", value: "Water Supply" },
      { label: "Location", value: "North Zone" },
      { label: "Contract Value", value: "₹27 Cr" },
      { label: "Progress", value: "72%" },
    ],
  };

  const ModuleComponent = moduleDefinition?.content;

  if (ModuleComponent) {
    return <ModuleComponent project={currentProject} />;
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full bg-amber-50 p-2 text-amber-600">
            {activeSection === "Overview" ? <LayoutDashboard size={18} /> : <Sparkles size={18} />}
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">
            {activeSection}
          </p>
        </div>

        <h2 className="mt-4 text-3xl font-bold text-slate-900">
          {content.title}
        </h2>

        <p className="mt-4 max-w-3xl leading-8 text-slate-600">
          {content.subtitle}
        </p>

        <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm text-slate-700">
          {content.highlight}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.8fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Project Snapshot
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                {currentProject.name}
              </h3>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600">
              {currentProject.status}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {content.items.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Project Brief</p>
            <p className="mt-2 leading-7 text-slate-600">
              {currentProject.description || "No project description available."}
            </p>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Quick Actions
          </p>

          <div className="mt-5 space-y-3">
            {workspaceQuickActions.map((action) => {
              const Icon = action.icon;

              return (
                <div key={action.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white p-2 text-amber-600 shadow-sm">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{action.label}</p>
                      <p className="text-sm text-slate-500">{action.value}</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500 shadow-sm">
                    Ready
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-amber-600" />
              <span className="font-semibold">{overviewNextAction.title}</span>
            </div>
            <p className="mt-2 leading-7">
              {overviewNextAction.detail}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
