import { useWorkspace } from "./WorkspaceContext";
import { getWorkspaceModules } from "./moduleRegistry";

export default function ProjectSidebar() {
  const { activeSection, setActiveSection } = useWorkspace();
  const menu = getWorkspaceModules();

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
          const selected = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
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
