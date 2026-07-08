import type { ComponentType } from "react";
import {
  Activity,
  CalendarDays,
  Camera,
  ClipboardList,
  FileText,
  FolderOpen,
  IndianRupee,
  LayoutDashboard,
  Package,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import type { Project } from "../../services/projects";
import EquipmentModule from "./EquipmentModule";
import FinanceModule from "./FinanceModule";
import LabourModule from "./LabourModule";
import MaterialsModule from "./MaterialsModule";
import RunningBillsModule from "./RunningBillsModule";
import VendorModule from "./VendorModule";

export interface WorkspaceModuleDefinition {
  id: string;
  title: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  content: ComponentType<{ project: Project }> | null;
  overview: {
    title: string;
    subtitle: string;
    highlight: string;
    items: Array<{ label: string; value: string }>;
  };
}

const moduleDefinitions: WorkspaceModuleDefinition[] = [
  {
    id: "Overview",
    title: "Overview",
    icon: LayoutDashboard,
    content: null,
    overview: {
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
  },
  {
    id: "Activity",
    title: "Activity",
    icon: Activity,
    content: null,
    overview: {
      title: "Activity Overview",
      subtitle: "Track recent site progress and delivery milestones at a glance.",
      highlight: "Activity remains aligned with the weekly execution plan.",
      items: [
        { label: "Last Update", value: "Today" },
        { label: "Open Issues", value: "2" },
        { label: "Pending Reviews", value: "3" },
      ],
    },
  },
  {
    id: "Documents",
    title: "Documents",
    icon: FolderOpen,
    content: null,
    overview: {
      title: "Documents Hub",
      subtitle: "Centralized access to drawings, approvals, and contracts.",
      highlight: "Latest revision pack uploaded 2 hours ago.",
      items: [
        { label: "Approved Drawings", value: "48" },
        { label: "Pending Review", value: "5" },
        { label: "Last Upload", value: "Today, 09:40" },
      ],
    },
  },
  {
    id: "Finance",
    title: "Finance",
    icon: IndianRupee,
    content: FinanceModule,
    overview: {
      title: "Finance Control",
      subtitle: "Monitor billing, commitments, and payment status in one place.",
      highlight: "Cash flow remains healthy with 4 bills approved this month.",
      items: [
        { label: "Budget Utilized", value: "₹18.6 Cr" },
        { label: "Pending Bills", value: "3" },
        { label: "Retention", value: "4.2%" },
      ],
    },
  },
  {
    id: "Site Diary",
    title: "Site Diary",
    icon: ClipboardList,
    content: null,
    overview: {
      title: "Site Diary",
      subtitle: "Daily construction notes, activities, and site observations.",
      highlight: "Concrete pour completed successfully with minimal rework.",
      items: [
        { label: "Today’s Activities", value: "6" },
        { label: "Weather Note", value: "Clear" },
        { label: "Safety Check", value: "Passed" },
      ],
    },
  },
  {
    id: "BOQ",
    title: "BOQ",
    icon: FileText,
    content: null,
    overview: {
      title: "BOQ Summary",
      subtitle: "Review quantities, rates, and progress against the bill of quantities.",
      highlight: "Current scope remains on target with the approved quantities.",
      items: [
        { label: "Items", value: "146" },
        { label: "Measured", value: "81%" },
        { label: "Variance", value: "2%" },
      ],
    },
  },
  {
    id: "Materials",
    title: "Materials",
    icon: Package,
    content: MaterialsModule,
    overview: {
      title: "Materials Planning",
      subtitle: "Manage procurement, consumption, and stock movement.",
      highlight: "Steel and cement deliveries are aligned to weekly demand.",
      items: [
        { label: "Stock Items", value: "126" },
        { label: "Low Inventory", value: "4" },
        { label: "PO Pending", value: "7" },
      ],
    },
  },
  {
    id: "Labour",
    title: "Labour",
    icon: Users,
    content: LabourModule,
    overview: {
      title: "Labour Operations",
      subtitle: "Track workforce deployment, productivity, and attendance.",
      highlight: "Skilled crew availability is balanced across core activities.",
      items: [
        { label: "Active Workers", value: "84" },
        { label: "Attendance", value: "96%" },
        { label: "Overtime", value: "12 hrs" },
      ],
    },
  },
  {
    id: "Timeline",
    title: "Timeline",
    icon: CalendarDays,
    content: null,
    overview: {
      title: "Timeline Overview",
      subtitle: "Keep milestones, dependencies, and delivery dates visible.",
      highlight: "The next milestone is scheduled for 14 Jul 2026.",
      items: [
        { label: "Milestones", value: "9" },
        { label: "Next Review", value: "12 Jul" },
        { label: "Critical Path", value: "2 items" },
      ],
    },
  },
  {
    id: "Photos",
    title: "Photos",
    icon: Camera,
    content: null,
    overview: {
      title: "Photo Log",
      subtitle: "Capture visual progress updates and site milestones.",
      highlight: "Recent photos show strong weekly progress across foundations.",
      items: [
        { label: "Latest Album", value: "Week 24" },
        { label: "Uploads", value: "32" },
        { label: "Quality Check", value: "Ready" },
      ],
    },
  },
  {
    id: "Equipment",
    title: "Equipment",
    icon: Camera,
    content: EquipmentModule,
    overview: {
      title: "Equipment Utilization",
      subtitle: "Monitor availability, utilization, and maintenance readiness.",
      highlight: "Two excavators are currently under planned service.",
      items: [
        { label: "Assigned Assets", value: "18" },
        { label: "Utilization", value: "81%" },
        { label: "Maintenance", value: "2" },
      ],
    },
  },
  {
    id: "Running Bills",
    title: "Running Bills",
    icon: ClipboardList,
    content: RunningBillsModule,
    overview: {
      title: "Running Bills",
      subtitle: "Track interim payments and billing progress against milestones.",
      highlight: "Billing cycle is aligned with current project milestones.",
      items: [
        { label: "Current Bill", value: "#8" },
        { label: "Submitted", value: "₹4.2 Cr" },
        { label: "Status", value: "In Review" },
      ],
    },
  },
  {
    id: "AP AI",
    title: "AP AI",
    icon: Sparkles,
    content: null,
    overview: {
      title: "AP AI Assistant",
      subtitle: "Leverage AI recommendations for risk, cost, and schedule insight.",
      highlight: "AI highlights one probable delay risk around material delivery.",
      items: [
        { label: "Insights", value: "3 New" },
        { label: "Risk Score", value: "Moderate" },
        { label: "Suggested Action", value: "Reorder steel" },
      ],
    },
  },
  {
    id: "Vendor Management",
    title: "Vendor Management",
    icon: Sparkles,
    content: VendorModule,
    overview: {
      title: "Vendor Operations",
      subtitle: "Track vendor coverage, payments, and performance metrics.",
      highlight: "Vendor performance remains strong across key supply categories.",
      items: [
        { label: "Active Vendors", value: "24" },
        { label: "Outstanding", value: "₹1.8 Cr" },
        { label: "Compliance", value: "92%" },
      ],
    },
  },
  {
    id: "Settings",
    title: "Settings",
    icon: Settings,
    content: null,
    overview: {
      title: "Workspace Settings",
      subtitle: "Review workspace preferences and module configurations.",
      highlight: "The current setup remains consistent with the existing operating model.",
      items: [
        { label: "Modules", value: "12" },
        { label: "Visibility", value: "Default" },
        { label: "Status", value: "Active" },
      ],
    },
  },
];

export function getWorkspaceModuleById(id: string): WorkspaceModuleDefinition | undefined {
  return moduleDefinitions.find((module) => module.id === id);
}

export function getWorkspaceModules(): WorkspaceModuleDefinition[] {
  return moduleDefinitions;
}
