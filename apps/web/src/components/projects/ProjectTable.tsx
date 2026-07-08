import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Project } from "../../services/projects";

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
}

export default function ProjectTable({
  projects = [],
  onView,
  onEdit,
  onDelete,
}: Props) {
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
              <td
                colSpan={5}
                className="py-10 text-center text-slate-500"
              >
                No projects found.
              </td>
            </tr>
          ) : (
            projects.map((project) => (
              <tr
                key={project.id}
                className="border-t hover:bg-slate-50"
              >
                <td className="px-6 py-4 font-medium">
                  {project.name}
                </td>

                <td className="px-6 py-4">
                  {project.client?.name ?? "—"}
                </td>

                <td className="px-6 py-4">
                  {statusLabel(project.status)}
                </td>

                <td className="px-6 py-4">
                  ₹{project.contractValue} Cr
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-center gap-4">
                    <button onClick={() => onView(project.id)}>
                      <Eye size={18} className="text-blue-600" />
                    </button>

                    <button onClick={() => onEdit(project.id)}>
                      <Pencil size={18} className="text-green-600" />
                    </button>

                    <button onClick={() => onDelete(project.id)}>
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}