import { useState } from "react";
import type { Project } from "../../services/projects";
import OverviewTab from "./tabs/OverviewTab";
import SubWorksTab from "./tabs/SubWorksTab";
import FinancialTab from "./tabs/FinancialTab";
import ProcurementTab from "./tabs/ProcurementTab";
import InventoryTab from "./tabs/InventoryTab";
import LabourTab from "./tabs/LabourTab";
import ExpensesTab from "./tabs/ExpensesTab";
import DocumentsTab from "./tabs/DocumentsTab";
import ReportsTab from "./tabs/ReportsTab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "sub-works", label: "Sub Works" },
  { key: "financial", label: "Financial" },
  { key: "procurement", label: "Procurement" },
  { key: "inventory", label: "Inventory" },
  { key: "labour", label: "Labour" },
  { key: "expenses", label: "Expenses" },
  { key: "documents", label: "Documents" },
  { key: "reports", label: "Reports" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ProjectControlCenter({ project }: { project: Project }) {
  const [tab, setTab] = useState<TabKey>("overview");

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-blue-600">{project.code || project.id}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{project.name}</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
              {project.client && <span>Client: <strong>{project.client.name}</strong></span>}
              {project.location && <span>Location: <strong>{project.location}</strong></span>}
              {project.manager && <span>Manager: <strong>{project.manager}</strong></span>}
            </div>
          </div>
          <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">{project.status}</span>
        </div>
      </div>

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
        {tab === "overview" && <OverviewTab project={project} />}
        {tab === "sub-works" && <SubWorksTab project={project} />}
        {tab === "financial" && <FinancialTab project={project} />}
        {tab === "procurement" && <ProcurementTab project={project} />}
        {tab === "inventory" && <InventoryTab project={project} />}
        {tab === "labour" && <LabourTab project={project} />}
        {tab === "expenses" && <ExpensesTab project={project} />}
        {tab === "documents" && <DocumentsTab project={project} />}
        {tab === "reports" && <ReportsTab project={project} />}
      </div>
    </div>
  );
}
