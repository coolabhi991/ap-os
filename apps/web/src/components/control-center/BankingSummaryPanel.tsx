import { useNavigate } from "react-router-dom";
import type { BankingSummary } from "../../services/control-center";
import { formatCurrency as inr } from "../../lib/utils";

export default function BankingSummaryPanel({ data }: { data: BankingSummary }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Banking Summary</h2>
        <button onClick={() => navigate("/banking")} className="text-xs text-blue-600 hover:underline">View All</button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Bank Balance</p>
          <p className="mt-1 text-lg font-bold">{inr(data.totalBankBalance)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Office Cash</p>
          <p className="mt-1 text-lg font-bold">{inr(data.officeCash)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Employee Advances</p>
          <p className="mt-1 text-lg font-bold">{inr(data.employeeAdvances)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Today's Net</p>
          <p className="mt-1 text-lg font-bold">{inr((Number(data.todayReceipts) - Number(data.todayPayments)).toFixed(2))}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-xs">
        <span className="text-emerald-600">Receipts: {inr(data.todayReceipts)}</span>
        <span className="text-red-600">Payments: {inr(data.todayPayments)}</span>
      </div>

      {data.bankAccounts.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {data.bankAccounts.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{a.name}</span>
              <span className="font-medium">{inr(a.currentBalance)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
