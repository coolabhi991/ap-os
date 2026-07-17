import type { CashFlowReport } from "../../services/banking-reports";
import { formatCurrency as inr } from "../../lib/utils";

export default function TodaysMovementCard({ data }: { data: CashFlowReport }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-slate-900">Today's Movement</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-50 p-3">
          <p className="text-xs text-emerald-700">Inflow Today</p>
          <p className="mt-1 text-lg font-bold text-emerald-700">{inr(data.today.inflow)}</p>
        </div>
        <div className="rounded-xl bg-red-50 p-3">
          <p className="text-xs text-red-700">Outflow Today</p>
          <p className="mt-1 text-lg font-bold text-red-700">{inr(data.today.outflow)}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3">
          <p className="text-xs text-blue-700">Net Today</p>
          <p className="mt-1 text-lg font-bold text-blue-700">{inr(data.today.net)}</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-3">
          <p className="text-xs text-slate-600">This Week's Net</p>
          <p className="mt-1 text-lg font-bold text-slate-800">{inr(data.weekly.net)}</p>
        </div>
      </div>
    </div>
  );
}
