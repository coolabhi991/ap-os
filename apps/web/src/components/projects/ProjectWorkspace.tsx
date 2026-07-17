import { useEffect, useState } from "react";
import type { Project, ProjectSiteOverview } from "../../services/projects";
import { getProjectSitesOverview } from "../../services/projects";
import OverviewTab from "./tabs/OverviewTab";
import SitesTab from "./tabs/SitesTab";
import RunningBillsTab from "./tabs/RunningBillsTab";
import SiteExpensesTab from "./tabs/SiteExpensesTab";
import VendorBillsTab from "./tabs/VendorBillsTab";
import FinanceTab from "./tabs/FinanceTab";
import TimelineTab from "./tabs/TimelineTab";
import ProjectQuickActions from "./ProjectQuickActions";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "sites", label: "Sites" },
  { key: "running-bills", label: "Running Bills" },
  { key: "site-expenses", label: "Site Expenses" },
  { key: "vendor-bills", label: "Vendor Bills" },
  { key: "finance", label: "Finance" },
  { key: "timeline", label: "Timeline" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ProjectWorkspace({ project }: { project: Project }) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [sites, setSites] = useState<ProjectSiteOverview[]>([]);

  useEffect(() => {
    getProjectSitesOverview(project.id).then(setSites).catch(() => {});
  }, [project.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-xl bg-white p-3 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.key ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "overview" && <OverviewTab projectId={project.id} />}
        {tab === "sites" && <SitesTab projectId={project.id} />}
        {tab === "running-bills" && <RunningBillsTab projectId={project.id} />}
        {tab === "site-expenses" && <SiteExpensesTab projectId={project.id} />}
        {tab === "vendor-bills" && <VendorBillsTab projectId={project.id} />}
        {tab === "finance" && <FinanceTab projectId={project.id} />}
        {tab === "timeline" && <TimelineTab projectId={project.id} />}
      </div>

      <ProjectQuickActions
        projectId={project.id}
        sites={sites}
        onGoToSites={() => setTab("sites")}
      />
    </div>
  );
}
