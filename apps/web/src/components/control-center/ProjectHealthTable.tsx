import { useNavigate } from "react-router-dom";
import type { ProjectHealthRow } from "../../services/control-center";

const VARIANCE_LABELS: Record<string, string> = { ahead: "Ahead", "on-track": "On Track", behind: "Behind" };
const VARIANCE_COLORS: Record<string, string> = {
  ahead: "bg-emerald-100 text-emerald-700",
  "on-track": "bg-blue-100 text-blue-700",
  behind: "bg-red-100 text-red-700",
};

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

export default function ProjectHealthTable({ projects }: { projects: ProjectHealthRow[] }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Project Health &amp; Budget vs Actual</h2>
          <p className="mt-1 text-sm text-slate-500">Physical progress vs financial progress, per active project.</p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">Project</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Budget</th>
              <th className="px-3 py-2 text-right">Actual</th>
              <th className="px-3 py-2 text-right">Difference</th>
              <th className="px-3 py-2 text-center">Physical</th>
              <th className="px-3 py-2 text-center">Financial</th>
              <th className="px-3 py-2 text-left">Variance</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr><td colSpan={8} className="py-8 text-center text-slate-500">No active projects.</td></tr>
            ) : (
              projects.map((p) => (
                <tr key={p.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => navigate(`/projects/${p.id}`)}>
                  <td className="px-3 py-3 font-medium">{p.name}</td>
                  <td className="px-3 py-3 text-slate-500">{p.status}</td>
                  <td className="px-3 py-3 text-right">{inr(p.budget)}</td>
                  <td className="px-3 py-3 text-right">{inr(p.actual)}</td>
                  <td className={`px-3 py-3 text-right font-medium ${Number(p.difference) < 0 ? "text-red-600" : "text-emerald-600"}`}>{inr(p.difference)}</td>
                  <td className="px-3 py-3 text-center">{p.physicalProgress}%</td>
                  <td className="px-3 py-3 text-center">{p.financialProgress}%</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${VARIANCE_COLORS[p.varianceStatus]}`}>{VARIANCE_LABELS[p.varianceStatus]}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
