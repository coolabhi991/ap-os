import { useState } from "react";
import type { Site } from "../../services/sites";
import OverviewTab from "./tabs/OverviewTab";
import RecapitulationTab from "./tabs/RecapitulationTab";
import SubWorksTab from "./tabs/SubWorksTab";
import FinancialTab from "./tabs/FinancialTab";
import DPRTab from "./tabs/DPRTab";
import MeasurementBooksTab from "./tabs/MeasurementBooksTab";
import RunningBillsTab from "./tabs/RunningBillsTab";
import LabourTab from "./tabs/LabourTab";
import ExpensesTab from "./tabs/ExpensesTab";
import SiteVisitsTab from "./tabs/SiteVisitsTab";
import DocumentsTab from "./tabs/DocumentsTab";
import ReportsTab from "./tabs/ReportsTab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "recapitulation", label: "Recapitulation" },
  { key: "sub-works", label: "Sub Works" },
  { key: "financial", label: "Financial" },
  { key: "dpr", label: "DPR" },
  { key: "measurement-books", label: "Measurement Books" },
  { key: "running-bills", label: "Running Bills" },
  { key: "labour", label: "Labour" },
  { key: "expenses", label: "Expenses" },
  { key: "site-visits", label: "Site Visits" },
  { key: "documents", label: "Documents" },
  { key: "reports", label: "Reports" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SiteWorkspace({ site }: { site: Site }) {
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
        {tab === "recapitulation" && <RecapitulationTab site={site} />}
        {tab === "sub-works" && <SubWorksTab site={site} />}
        {tab === "financial" && <FinancialTab site={site} />}
        {tab === "dpr" && <DPRTab site={site} />}
        {tab === "measurement-books" && <MeasurementBooksTab site={site} />}
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
