import { useNavigate } from "react-router-dom";
import type { ControlCenterData } from "../../services/control-center";
import { formatCurrency as inr } from "../../lib/utils";

export default function VendorPositionCard({ data }: { data: ControlCenterData["payables"] }) {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Vendor Position</h2>
        <button onClick={() => navigate("/banking/reports")} className="text-xs text-blue-600 hover:underline">View All</button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-red-50 p-3">
          <p className="text-xs text-red-700">Total Payable</p>
          <p className="mt-1 text-lg font-bold text-red-700">{inr(data.total)}</p>
        </div>
        <div className="rounded-xl bg-orange-50 p-3">
          <p className="text-xs text-orange-700">Overdue Amount</p>
          <p className="mt-1 text-lg font-bold text-orange-700">{inr(data.overdueAmount)}</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-3">
          <p className="text-xs text-slate-600">Total Bills</p>
          <p className="mt-1 text-lg font-bold text-slate-800">{data.count}</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3">
          <p className="text-xs text-amber-700">Overdue Bills</p>
          <p className="mt-1 text-lg font-bold text-amber-700">{data.overdueCount}</p>
        </div>
      </div>
    </div>
  );
}
