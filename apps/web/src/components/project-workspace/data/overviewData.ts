import { CalendarDays, Camera, ClipboardList, FileText, IndianRupee, Package, Users } from "lucide-react";

export const workspaceQuickActions = [
  { label: "Documents", icon: FileText, value: "48 files" },
  { label: "Finance", icon: IndianRupee, value: "₹4.2 Cr billed" },
  { label: "Labour", icon: Users, value: "84 onsite" },
  { label: "Materials", icon: Package, value: "126 items" },
  { label: "Timeline", icon: CalendarDays, value: "9 milestones" },
  { label: "Photos", icon: Camera, value: "32 captures" },
];

export const defaultOverviewContent = {
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

export const overviewNextAction = {
  title: "Next action",
  detail: "Review the latest site diary and verify the next approval milestone before the weekly review.",
  icon: ClipboardList,
};
