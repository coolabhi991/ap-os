import { Fragment, useState } from "react";
import { ChevronRight, ChevronDown, Eye, Pencil, Trash2, Plus, MapPin } from "lucide-react";
import type { ProjectDashboardRow, ProjectDashboardSite } from "../../services/projects";
import { deleteSite, SITE_STATUS_LABELS, SITE_STATUS_COLORS, SITE_TYPE_LABELS } from "../../services/sites";
import { formatCurrency as inr, formatDate } from "../../lib/utils";

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PLANNING: "Planning",
    ACTIVE: "Active",
    ON_HOLD: "On Hold",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return map[status] ?? status;
}

function ProgressBadge({ value }: { value: number }) {
  const color = value >= 100 ? "bg-emerald-100 text-emerald-700" : value >= 50 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{value}%</span>;
}

interface Props {
  projects?: ProjectDashboardRow[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewSite: (id: string) => void;
  onEditSite: (id: string) => void;
  onAddSite: (projectId: string) => void;
  onSiteDeleted: () => void;
}

export default function ProjectTable({
  projects = [],
  onView,
  onEdit,
  onDelete,
  onViewSite,
  onEditSite,
  onAddSite,
  onSiteDeleted,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (projectId: string) => setExpandedId((cur) => (cur === projectId ? null : projectId));

  const handleDeleteSite = async (site: ProjectDashboardSite) => {
    if (!window.confirm("Are you sure you want to delete this site?")) return;
    try {
      await deleteSite(site.id);
      onSiteDeleted();
    } catch {
      alert("Failed to delete site. It may still have operational records linked to it.");
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-4 text-left">Project</th>
              <th className="px-6 py-4 text-left">Client</th>
              <th className="px-6 py-4 text-right">Total Sites</th>
              <th className="px-6 py-4 text-right">Total Project Cost</th>
              <th className="px-6 py-4 text-right">Client Payments Received</th>
              <th className="px-6 py-4 text-right">Outstanding</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500">
                  No projects found.
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <Fragment key={project.id}>
                  <tr className="border-t hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">
                      <button
                        onClick={() => toggleExpand(project.id)}
                        className="flex items-center gap-2 text-left"
                      >
                        {expandedId === project.id ? (
                          <ChevronDown size={16} className="shrink-0 text-slate-400" />
                        ) : (
                          <ChevronRight size={16} className="shrink-0 text-slate-400" />
                        )}
                        <span>
                          {project.name}
                          {project.code && <span className="ml-2 font-mono text-xs font-normal text-slate-400">{project.code}</span>}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4">{project.client?.name ?? "—"}</td>
                    <td className="px-6 py-4 text-right">{project.totalSites}</td>
                    <td className="px-6 py-4 text-right">{inr(project.totalProjectCost)}</td>
                    <td className="px-6 py-4 text-right">{inr(project.totalClientPaymentsReceived)}</td>
                    <td className="px-6 py-4 text-right font-medium text-amber-600">{inr(project.totalOutstanding)}</td>
                    <td className="px-6 py-4">{statusLabel(project.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-4">
                        <button onClick={() => onAddSite(project.id)} title="Add Site">
                          <Plus size={18} className="text-blue-600" />
                        </button>
                        <button onClick={() => onView(project.id)} title="View Project">
                          <Eye size={18} className="text-blue-600" />
                        </button>
                        <button onClick={() => onEdit(project.id)} title="Edit Project">
                          <Pencil size={18} className="text-green-600" />
                        </button>
                        <button onClick={() => onDelete(project.id)} title="Delete Project">
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedId === project.id && (
                    <tr className="border-t bg-slate-50/60">
                      <td colSpan={8} className="px-6 py-4">
                        {project.sites.length === 0 ? (
                          <p className="py-2 text-sm text-slate-500">No sites yet for this project.</p>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                            <table className="min-w-full text-sm">
                              <thead className="bg-slate-100">
                                <tr>
                                  <th className="px-3 py-2.5 text-left">Site</th>
                                  <th className="px-3 py-2.5 text-left">Taluka</th>
                                  <th className="px-3 py-2.5 text-left">Type</th>
                                  <th className="px-3 py-2.5 text-right">Tender Cost</th>
                                  <th className="px-3 py-2.5 text-left">WO Start</th>
                                  <th className="px-3 py-2.5 text-left">Original WO End</th>
                                  <th className="px-3 py-2.5 text-left">Extension Till</th>
                                  <th className="px-3 py-2.5 text-right">Client Payments</th>
                                  <th className="px-3 py-2.5 text-right">Outstanding</th>
                                  <th className="px-3 py-2.5 text-center">Physical</th>
                                  <th className="px-3 py-2.5 text-center">Financial</th>
                                  <th className="px-3 py-2.5 text-left">Status</th>
                                  <th className="px-3 py-2.5 text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {project.sites.map((site) => (
                                  <tr key={site.id} className="border-t">
                                    <td className="px-3 py-2.5">
                                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                        <MapPin size={12} className="shrink-0 text-slate-400" />
                                        {site.name}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-600">{site.taluka || "—"}</td>
                                    <td className="px-3 py-2.5 text-slate-600">{SITE_TYPE_LABELS[site.siteType] ?? site.siteType}</td>
                                    <td className="px-3 py-2.5 text-right">{inr(site.tenderCost)}</td>
                                    <td className="px-3 py-2.5 text-slate-600">{site.workOrderDate ? formatDate(site.workOrderDate) : "—"}</td>
                                    <td className="px-3 py-2.5 text-slate-600">{site.completionDate ? formatDate(site.completionDate) : "—"}</td>
                                    <td className="px-3 py-2.5 text-slate-600">{site.extensionTillDate ? formatDate(site.extensionTillDate) : "—"}</td>
                                    <td className="px-3 py-2.5 text-right">{inr(site.clientPaymentsReceived)}</td>
                                    <td className="px-3 py-2.5 text-right font-medium text-amber-600">{inr(site.outstandingAmount)}</td>
                                    <td className="px-3 py-2.5 text-center"><ProgressBadge value={site.physicalProgress} /></td>
                                    <td className="px-3 py-2.5 text-center"><ProgressBadge value={site.financialProgress} /></td>
                                    <td className="px-3 py-2.5">
                                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SITE_STATUS_COLORS[site.status]}`}>
                                        {SITE_STATUS_LABELS[site.status]}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <div className="flex items-center justify-center gap-2.5">
                                        <button onClick={() => onViewSite(site.id)} title="View Site">
                                          <Eye size={14} className="text-blue-600" />
                                        </button>
                                        <button onClick={() => onEditSite(site.id)} title="Edit Site">
                                          <Pencil size={14} className="text-green-600" />
                                        </button>
                                        <button onClick={() => handleDeleteSite(site)} title="Delete Site">
                                          <Trash2 size={14} className="text-red-600" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
