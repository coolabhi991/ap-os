import { useNavigate } from "react-router-dom";
import type { GovernmentSummary } from "../../services/control-center";

const ITEMS: { key: keyof GovernmentSummary; label: string; color: string }[] = [
  { key: "billsReady", label: "Bills Ready", color: "bg-slate-100 text-slate-700" },
  { key: "submitted", label: "Submitted", color: "bg-blue-100 text-blue-700" },
  { key: "underCorrection", label: "Under Correction", color: "bg-amber-100 text-amber-700" },
  { key: "awaitingPayment", label: "Awaiting Payment", color: "bg-orange-100 text-orange-700" },
  { key: "partialPayments", label: "Partial Payments", color: "bg-purple-100 text-purple-700" },
];

export default function GovernmentSummaryPanel({ data }: { data: GovernmentSummary }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Government Summary</h2>
        <button onClick={() => navigate("/running-bills")} className="text-xs text-blue-600 hover:underline">View All</button>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-2">
        {ITEMS.map((item) => (
          <div key={item.key} className={`rounded-xl p-3 text-center ${item.color}`}>
            <p className="text-xl font-bold">{data[item.key]}</p>
            <p className="mt-1 text-[11px] leading-tight">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
