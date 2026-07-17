import { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronDown, Eye, MapPin } from "lucide-react";
import type { ProjectHealthRow } from "../../services/control-center";
import { SITE_STATUS_LABELS, SITE_STATUS_COLORS } from "../../services/sites";
import { formatCurrency as inr, formatDate } from "../../lib/utils";

const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function ProgressBadge({ value }: { value: number }) {
  const color = value >= 100 ? "bg-emerald-100 text-emerald-700" : value >= 50 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{value}%</span>;
}

export default function ProjectOverviewPanel({ projects }: { projects: ProjectHealthRow[] }) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpand = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-base font-bold text-slate-900">Projects Overview</h2>
        <button onClick={() => navigate("/projects")} className="text-xs text-blue-600 hover:underline">View All</button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Project</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Payment Received</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Balance Receivable</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Bills Submitted</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Pending Bill Payment</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-600">Physical %</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-600">Financial %</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-slate-500">No active projects.</td>
              </tr>
            ) : (
              projects.map((p) => (
                <Fragment key={p.id}>
                  <tr className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <button onClick={() => toggleExpand(p.id)} className="flex items-center gap-2 text-left">
                        {expandedId === p.id ? <ChevronDown size={16} className="shrink-0 text-slate-400" /> : <ChevronRight size={16} className="shrink-0 text-slate-400" />}
                        {p.name}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PROJECT_STATUS_COLORS[p.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {PROJECT_STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{inr(p.received)}</td>
                    <td className="px-4 py-3 text-right font-medium text-amber-600">{inr(p.pending)}</td>
                    <td className="px-4 py-3 text-right">{p.billsSubmitted}</td>
                    <td className="px-4 py-3 text-right font-medium text-red-600">{inr(p.pendingBillPayment)}</td>
                    <td className="px-4 py-3 text-center"><ProgressBadge value={p.physicalProgress} /></td>
                    <td className="px-4 py-3 text-center"><ProgressBadge value={p.financialProgress} /></td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => navigate(`/projects/${p.id}`)} title="View Project">
                        <Eye size={16} className="text-blue-600" />
                      </button>
                    </td>
                  </tr>

                  {expandedId === p.id && (
                    <tr className="border-t border-slate-100 bg-slate-50/60">
                      <td colSpan={9} className="px-4 py-4">
                        {p.sites.length === 0 ? (
                          <p className="py-2 text-sm text-slate-500">No sites yet for this project.</p>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                            <table className="min-w-full text-xs">
                              <thead className="bg-slate-100">
                                <tr>
                                  <th className="px-3 py-2.5 text-left">Site</th>
                                  <th className="px-3 py-2.5 text-left">Status</th>
                                  <th className="px-3 py-2.5 text-left">Expected Completion</th>
                                  <th className="px-3 py-2.5 text-right">Payment Received</th>
                                  <th className="px-3 py-2.5 text-right">Bills Submitted</th>
                                  <th className="px-3 py-2.5 text-right">Pending Expenses</th>
                                  <th className="px-3 py-2.5 text-center">Physical %</th>
                                  <th className="px-3 py-2.5 text-center">Financial %</th>
                                  <th className="px-3 py-2.5 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {p.sites.map((s) => (
                                  <tr key={s.id} className="border-t border-slate-100">
                                    <td className="px-3 py-2.5">
                                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                        <MapPin size={12} className="shrink-0 text-slate-400" />
                                        {s.name}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SITE_STATUS_COLORS[s.status] ?? "bg-slate-100 text-slate-700"}`}>
                                        {SITE_STATUS_LABELS[s.status] ?? s.status}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-600">{s.expectedCompletion ? formatDate(s.expectedCompletion) : "—"}</td>
                                    <td className="px-3 py-2.5 text-right">{inr(s.paymentReceived)}</td>
                                    <td className="px-3 py-2.5 text-right">{s.billsSubmitted}</td>
                                    <td className="px-3 py-2.5 text-right font-medium text-red-600">{inr(s.pendingExpenses)}</td>
                                    <td className="px-3 py-2.5 text-center"><ProgressBadge value={s.physicalProgress} /></td>
                                    <td className="px-3 py-2.5 text-center"><ProgressBadge value={s.financialProgress} /></td>
                                    <td className="px-3 py-2.5 text-center">
                                      <button onClick={() => navigate(`/sites/${s.id}`)} title="View Site">
                                        <Eye size={14} className="text-blue-600" />
                                      </button>
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
