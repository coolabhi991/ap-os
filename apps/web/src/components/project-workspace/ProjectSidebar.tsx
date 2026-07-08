import {
  LayoutDashboard,
  Activity,
  FolderOpen,
  IndianRupee,
  ClipboardList,
  FileText,
  Package,
  Users,
  CalendarDays,
  Camera,
  Sparkles,
  Settings,
} from "lucide-react";

const menu = [
  {
    title: "Overview",
    icon: LayoutDashboard,
  },
  {
    title: "Activity",
    icon: Activity,
  },
  {
    title: "Documents",
    icon: FolderOpen,
  },
  {
    title: "Finance",
    icon: IndianRupee,
  },
  {
    title: "Site Diary",
    icon: ClipboardList,
  },
  {
    title: "BOQ",
    icon: FileText,
  },
  {
    title: "Materials",
    icon: Package,
  },
  {
    title: "Labour",
    icon: Users,
  },
  {
    title: "Timeline",
    icon: CalendarDays,
  },
  {
    title: "Photos",
    icon: Camera,
  },
  {
    title: "AP AI",
    icon: Sparkles,
  },
  {
    title: "Settings",
    icon: Settings,
  },
];

interface ProjectSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function ProjectSidebar({
  activeSection,
  onSectionChange,
}: ProjectSidebarProps) {
  return (
    <div className="w-full rounded-3xl border border-white/40 bg-white/70 p-4 shadow-xl backdrop-blur-xl xl:w-72">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
          Workspace
        </p>

        <h2 className="mt-2 text-xl font-bold text-slate-900">
          Navigation
        </h2>
      </div>

      <div className="space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;

          const selected = activeSection === item.title;

          return (
            <button
              key={item.title}
              onClick={() => onSectionChange(item.title)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200 ${
                selected
                  ? "bg-amber-500 text-white shadow-lg"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              <Icon size={19} />

              <span className="font-medium">
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}