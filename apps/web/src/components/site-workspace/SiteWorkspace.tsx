import { useState } from "react";
import type { Site } from "../../services/sites";
import OverviewTab from "./tabs/OverviewTab";
import WorkOrderDetailsTab from "./tabs/WorkOrderDetailsTab";
import RecapitulationTab from "./tabs/RecapitulationTab";
import FinancialTab from "./tabs/FinancialTab";
import DPRTab from "./tabs/DPRTab";
import RunningBillsTab from "./tabs/RunningBillsTab";
import LabourTab from "./tabs/LabourTab";
import ExpensesTab from "./tabs/ExpensesTab";
import SiteVisitsTab from "./tabs/SiteVisitsTab";
import DocumentsTab from "./tabs/DocumentsTab";
import ReportsTab from "./tabs/ReportsTab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "work-order-details", label: "Work Order Details" },
  { key: "recapitulation", label: "Recapitulation" },
  { key: "financial", label: "Financial" },
  { key: "dpr", label: "DPR History" },
  { key: "running-bills", label: "Running Bills" },
  { key: "labour", label: "Labour" },
  { key: "expenses", label: "Expenses" },
  { key: "site-visits", label: "Site Visits" },
  { key: "documents", label: "Documents" },
  { key: "reports", label: "Reports" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SiteWorkspace({ site, onSiteUpdated }: { site: Site; onSiteUpdated: (site: Site) => void }) {
  const [tab, setTab] = useState<TabKey>("overview");

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
        {tab === "overview" && <OverviewTab site={site} />}
        {tab === "work-order-details" && <WorkOrderDetailsTab site={site} onSiteUpdated={onSiteUpdated} />}
        {tab === "recapitulation" && <RecapitulationTab site={site} />}
        {tab === "financial" && <FinancialTab site={site} />}
        {tab === "dpr" && <DPRTab site={site} />}
        {tab === "running-bills" && <RunningBillsTab site={site} />}
        {tab === "labour" && <LabourTab site={site} />}
        {tab === "expenses" && <ExpensesTab site={site} />}
        {tab === "site-visits" && <SiteVisitsTab site={site} />}
        {tab === "documents" && <DocumentsTab site={site} />}
        {tab === "reports" && <ReportsTab site={site} />}
      </div>
    </div>
  );
}
