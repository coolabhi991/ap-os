import { useEffect, useState } from "react";
import { getProjectOverview } from "../../../services/projects";
import type { ProjectOverview } from "../../../services/projects";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from "../../../services/projects";
import { formatCurrency as inr, formatDate } from "../../../lib/utils";
import LoadingState from "../../ui/LoadingState";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value ?? "—"}</p>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{value}%</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

export default function OverviewTab({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ProjectOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getProjectOverview(projectId)
      .then(setData)
      .catch(() => setError("Failed to load project overview."))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <LoadingState label="Loading overview..." />;
  if (error || !data) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error ?? "Not found."}</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Project Information</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${PROJECT_STATUS_COLORS[data.status] ?? "bg-slate-100 text-slate-700"}`}>
            {PROJECT_STATUS_LABELS[data.status] ?? data.status}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Client" value={data.client?.name} />
          <Field label="Department" value={data.department} />
          <Field label="Work Order No." value={data.workOrderNumber} />
          <Field label="Work Order Date" value={data.workOrderDate ? formatDate(data.workOrderDate) : null} />
          <Field label="Expected Completion" value={data.expectedCompletion ? formatDate(data.expectedCompletion) : null} />
          <Field label="Agreement Value" value={inr(data.agreementValue)} />
          <Field label="Sites" value={data.siteCount} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Payment Received</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">{inr(data.paymentReceived)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Balance Receivable</p>
          <p className="mt-1 text-xl font-bold text-amber-600">{inr(data.balanceReceivable)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Physical Progress</p>
          <div className="mt-2"><ProgressBar value={data.physicalProgress} color="bg-blue-500" /></div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Financial Progress</p>
          <div className="mt-2"><ProgressBar value={data.financialProgress} color="bg-emerald-500" /></div>
        </div>
      </div>
    </div>
  );
}
