import { useNavigate } from "react-router-dom";
import type { OwnerDesk, ControlCenterAlert } from "../../services/control-center";

const SECTIONS: { key: "critical" | "high" | "normal"; label: string; dot: string }[] = [
  { key: "critical", label: "Critical", dot: "bg-red-500" },
  { key: "high", label: "High", dot: "bg-amber-500" },
  { key: "normal", label: "Normal", dot: "bg-blue-500" },
];

function Item({ alert }: { alert: ControlCenterAlert }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(alert.link)}
      className="block w-full rounded-lg border border-slate-100 px-3 py-2 text-left text-xs hover:bg-slate-50"
    >
      <p className="font-medium text-slate-700">{alert.category}</p>
      <p className="mt-0.5 text-slate-500">{alert.message}</p>
    </button>
  );
}

export default function OwnersDeskPanel({ data }: { data: OwnerDesk }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-slate-900">Owner's Desk</h2>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-50 p-3 text-center">
          <p className="text-xl font-bold text-emerald-700">{data.completedToday}</p>
          <p className="text-[11px] text-emerald-700">Completed Today</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3 text-center">
          <p className="text-xl font-bold text-amber-700">{data.remainingToday}</p>
          <p className="text-[11px] text-amber-700">Remaining Today</p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {SECTIONS.map((section) => {
          const items = data[section.key];
          return (
            <div key={section.key}>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${section.dot}`} />
                <p className="text-xs font-semibold text-slate-700">{section.label} ({items.length})</p>
              </div>
              <div className="mt-2 space-y-1.5">
                {items.length === 0 ? (
                  <p className="px-3 text-xs text-slate-400">Nothing here.</p>
                ) : (
                  items.map((a, i) => <Item key={`${section.key}-${i}`} alert={a} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
