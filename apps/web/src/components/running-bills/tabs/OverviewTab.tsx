import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { RunningBill } from "../../../services/running-bills";
import { RB_STATUS_LABELS, RB_STATUS_COLORS } from "../../../services/running-bills";
import { getSite } from "../../../services/sites";
import type { Site } from "../../../services/sites";
import { formatCurrency as inr, formatDate } from "../../../lib/utils";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value ?? "—"}</p>
    </div>
  );
}

export default function OverviewTab({ bill }: { bill: RunningBill }) {
  const navigate = useNavigate();
  const [site, setSite] = useState<Site | null>(null);

  useEffect(() => {
    getSite(bill.siteId).then(setSite).catch(() => {});
  }, [bill.siteId]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Bill Information</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${RB_STATUS_COLORS[bill.status] ?? "bg-slate-100 text-slate-700"}`}>
            {RB_STATUS_LABELS[bill.status] ?? bill.status}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Bill No." value={bill.billNumber} />
          <Field
            label="Project"
            value={bill.project ? <button onClick={() => navigate(`/projects/${bill.projectId}`)} className="text-blue-600 hover:underline">{bill.project.name}</button> : null}
          />
          <Field
            label="Site"
            value={bill.siteRecord ? <button onClick={() => navigate(`/sites/${bill.siteId}`)} className="text-blue-600 hover:underline">{bill.siteRecord.name}</button> : null}
          />
          <Field label="Bill Date" value={formatDate(bill.billDate)} />
          <Field label="Bill Submitted Date" value={bill.billSubmittedDate ? formatDate(bill.billSubmittedDate) : "—"} />
          <Field label="Work Order" value={site ? `${site.workOrderNumber || "—"}${site.workOrderDate ? ` (${formatDate(site.workOrderDate)})` : ""}` : "—"} />
          <Field label="Agreement Value" value={site ? inr(site.contractValue) : "—"} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Previous Bills</p>
          <p className="mt-1 text-lg font-bold text-slate-700">{inr(bill.previousCertifiedAmount)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Current Bill</p>
          <p className="mt-1 text-lg font-bold text-blue-600">{inr(bill.currentCertifiedAmount)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-900 p-5 shadow-sm">
          <p className="text-xs text-white/70">Total Billed (To Date)</p>
          <p className="mt-1 text-lg font-bold text-white">{inr(bill.totalCertifiedAmount)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Total Received</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">{inr(bill.amountReceived)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Balance Receivable</p>
          <p className="mt-1 text-xl font-bold text-amber-600">{inr(bill.outstandingAmount)}</p>
        </div>
      </div>
    </div>
  );
}
