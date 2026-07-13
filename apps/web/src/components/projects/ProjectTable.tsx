import { Fragment, useState } from "react";
import { ChevronRight, ChevronDown, Eye, Pencil, Trash2, Plus, MapPin } from "lucide-react";
import type { Project } from "../../services/projects";
import { getSites, deleteSite } from "../../services/sites";
import type { Site } from "../../services/sites";
import { SITE_STATUS_LABELS, SITE_STATUS_COLORS } from "../../services/sites";

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

interface Props {
  projects?: Project[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewSite: (id: string) => void;
  onEditSite: (id: string) => void;
  onAddSite: (projectId: string) => void;
}

export default function ProjectTable({
  projects = [],
  onView,
  onEdit,
  onDelete,
  onViewSite,
  onEditSite,
  onAddSite,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sitesByProject, setSitesByProject] = useState<Record<string, Site[]>>({});
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);

  const toggleExpand = async (projectId: string) => {
    if (expandedId === projectId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(projectId);
    if (!sitesByProject[projectId]) {
      setLoadingProjectId(projectId);
      try {
        const sites = await getSites(projectId);
        setSitesByProject((prev) => ({ ...prev, [projectId]: sites }));
      } catch {
        setSitesByProject((prev) => ({ ...prev, [projectId]: [] }));
      } finally {
        setLoadingProjectId(null);
      }
    }
  };

  const handleDeleteSite = async (projectId: string, siteId: string) => {
    if (!window.confirm("Are you sure you want to delete this site?")) return;
    try {
      await deleteSite(siteId);
      setSitesByProject((prev) => ({ ...prev, [projectId]: prev[projectId].filter((s) => s.id !== siteId) }));
    } catch {
      alert("Failed to delete site. It may still have operational records linked to it.");
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-6 py-4 text-left">Project</th>
            <th className="px-6 py-4 text-left">Client</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-left">Budget</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {projects.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-10 text-center text-slate-500">
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
                  <td className="px-6 py-4">{statusLabel(project.status)}</td>
                  <td className="px-6 py-4">₹{project.contractValue} Cr</td>
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
                    <td colSpan={5} className="px-6 py-4">
                      {loadingProjectId === project.id && (
                        <p className="py-2 text-sm text-slate-500">Loading sites...</p>
                      )}
                      {loadingProjectId !== project.id && (sitesByProject[project.id]?.length ?? 0) === 0 && (
                        <p className="py-2 text-sm text-slate-500">No sites yet for this project.</p>
                      )}
                      {loadingProjectId !== project.id && (sitesByProject[project.id]?.length ?? 0) > 0 && (
                        <div className="space-y-2">
                          {sitesByProject[project.id].map((site) => (
                            <div
                              key={site.id}
                              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5"
                            >
                              <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-slate-400" />
                                <span className="font-medium text-slate-800">{site.name}</span>
                                {site.siteCode && (
                                  <span className="font-mono text-xs text-slate-400">{site.siteCode}</span>
                                )}
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SITE_STATUS_COLORS[site.status]}`}>
                                  {SITE_STATUS_LABELS[site.status]}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <button onClick={() => onViewSite(site.id)} title="View Site">
                                  <Eye size={16} className="text-blue-600" />
                                </button>
                                <button onClick={() => onEditSite(site.id)} title="Edit Site">
                                  <Pencil size={16} className="text-green-600" />
                                </button>
                                <button onClick={() => handleDeleteSite(project.id, site.id)} title="Delete Site">
                                  <Trash2 size={16} className="text-red-600" />
                                </button>
                              </div>
                            </div>
                          ))}
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
  );
}
