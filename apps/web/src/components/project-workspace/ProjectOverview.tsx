import { FileText, IndianRupee, Package, Users, CalendarDays, Camera, Sparkles, ClipboardList, LayoutDashboard } from "lucide-react";
import type { Project } from "../../services/projects";
import FinanceModule from "./FinanceModule";
import MaterialsModule from "./MaterialsModule";

interface ProjectOverviewProps {
  project: Project;
  activeSection: string;
}

const sectionContent: Record<string, { title: string; subtitle: string; highlight: string; items: Array<{ label: string; value: string }> }> = {
  Overview: {
    title: "Project Summary",
    subtitle: "A high-level pulse of the project health, delivery plan, and control points.",
    highlight: "On track with strong visibility across contract, delivery, and site operations.",
    items: [
      { label: "Project Type", value: "Water Supply" },
      { label: "Location", value: "North Zone" },
      { label: "Contract Value", value: "₹27 Cr" },
      { label: "Progress", value: "72%" },
    ],
  },
  Finance: {
    title: "Finance Control",
    subtitle: "Monitor billing, commitments, and payment status in one place.",
    highlight: "Cash flow remains healthy with 4 bills approved this month.",
    items: [
      { label: "Budget Utilized", value: "₹18.6 Cr" },
      { label: "Pending Bills", value: "3" },
      { label: "Retention", value: "4.2%" },
    ],
  },
  Documents: {
    title: "Documents Hub",
    subtitle: "Centralized access to drawings, approvals, and contracts.",
    highlight: "Latest revision pack uploaded 2 hours ago.",
    items: [
      { label: "Approved Drawings", value: "48" },
      { label: "Pending Review", value: "5" },
      { label: "Last Upload", value: "Today, 09:40" },
    ],
  },
  "Site Diary": {
    title: "Site Diary",
    subtitle: "Daily construction notes, activities, and site observations.",
    highlight: "Concrete pour completed successfully with minimal rework.",
    items: [
      { label: "Today’s Activities", value: "6" },
      { label: "Weather Note", value: "Clear" },
      { label: "Safety Check", value: "Passed" },
    ],
  },
  Labour: {
    title: "Labour Operations",
    subtitle: "Track workforce deployment, productivity, and attendance.",
    highlight: "Skilled crew availability is balanced across core activities.",
    items: [
      { label: "Active Workers", value: "84" },
      { label: "Attendance", value: "96%" },
      { label: "Overtime", value: "12 hrs" },
    ],
  },
  Materials: {
    title: "Materials Planning",
    subtitle: "Manage procurement, consumption, and stock movement.",
    highlight: "Steel and cement deliveries are aligned to weekly demand.",
    items: [
      { label: "Stock Items", value: "126" },
      { label: "Low Inventory", value: "4" },
      { label: "PO Pending", value: "7" },
    ],
  },
  Equipment: {
    title: "Equipment Utilization",
    subtitle: "Monitor availability, utilization, and maintenance readiness.",
    highlight: "Two excavators are currently under planned service.",
    items: [
      { label: "Assigned Assets", value: "18" },
      { label: "Utilization", value: "81%" },
      { label: "Maintenance", value: "2" },
    ],
  },
  "Running Bills": {
    title: "Running Bills",
    subtitle: "Track interim payments and billing progress against milestones.",
    highlight: "Billing cycle is aligned with current project milestones.",
    items: [
      { label: "Current Bill", value: "#8" },
      { label: "Submitted", value: "₹4.2 Cr" },
      { label: "Status", value: "In Review" },
    ],
  },
  Timeline: {
    title: "Timeline Overview",
    subtitle: "Keep milestones, dependencies, and delivery dates visible.",
    highlight: "The next milestone is scheduled for 14 Jul 2026.",
    items: [
      { label: "Milestones", value: "9" },
      { label: "Next Review", value: "12 Jul" },
      { label: "Critical Path", value: "2 items" },
    ],
  },
  Photos: {
    title: "Photo Log",
    subtitle: "Capture visual progress updates and site milestones.",
    highlight: "Recent photos show strong weekly progress across foundations.",
    items: [
      { label: "Latest Album", value: "Week 24" },
      { label: "Uploads", value: "32" },
      { label: "Quality Check", value: "Ready" },
    ],
  },
  "AP AI": {
    title: "AP AI Assistant",
    subtitle: "Leverage AI recommendations for risk, cost, and schedule insight.",
    highlight: "AI highlights one probable delay risk around material delivery.",
    items: [
      { label: "Insights", value: "3 New" },
      { label: "Risk Score", value: "Moderate" },
      { label: "Suggested Action", value: "Reorder steel" },
    ],
  },
};

const quickActions = [
  { label: "Documents", icon: FileText, value: "48 files" },
  { label: "Finance", icon: IndianRupee, value: "₹4.2 Cr billed" },
  { label: "Labour", icon: Users, value: "84 onsite" },
  { label: "Materials", icon: Package, value: "126 items" },
  { label: "Timeline", icon: CalendarDays, value: "9 milestones" },
  { label: "Photos", icon: Camera, value: "32 captures" },
];

export default function ProjectOverview({
  project,
  activeSection,
}: ProjectOverviewProps) {
  const content = sectionContent[activeSection] ?? sectionContent.Overview;

  if (activeSection === "Finance") {
    return <FinanceModule project={project} />;
  }

  if (activeSection === "Materials") {
    return <MaterialsModule project={project} />;
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
                {project.name}
              </h3>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600">
              {project.status}
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
              {project.description || "No project description available."}
            </p>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Quick Actions
          </p>

          <div className="mt-5 space-y-3">
            {quickActions.map((action) => {
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
              <span className="font-semibold">Next action</span>
            </div>
            <p className="mt-2 leading-7">
              Review the latest site diary and verify the next approval milestone before the weekly review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}