import { useNavigate } from "react-router-dom";
import { MapPinPlus, FileText, Receipt } from "lucide-react";
import type { ProjectSiteOverview } from "../../services/projects";

interface Props {
  projectId: string;
  sites: ProjectSiteOverview[];
  onGoToSites: () => void;
}

export default function ProjectQuickActions({ projectId, sites, onGoToSites }: Props) {
  const navigate = useNavigate();

  const handleNewRunningBill = () => {
    if (sites.length === 0) {
      alert("Add a Site first — Running Bills are raised against a Site.");
      return;
    }
    if (sites.length === 1) {
      navigate(`/running-bills/new?siteId=${sites[0].id}`);
      return;
    }
    onGoToSites();
  };

  const actions = [
    { label: "Add Site", icon: MapPinPlus, onClick: () => navigate(`/projects/${projectId}/sites/new`) },
    { label: "New Running Bill", icon: FileText, onClick: handleNewRunningBill },
    { label: "Add Expense", icon: Receipt, onClick: () => navigate(`/expenses/new?projectId=${projectId}`) },
  ];

  return (
    <div className="sticky bottom-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            <a.icon size={16} />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
