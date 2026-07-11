import { useNavigate } from "react-router-dom";
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import type { ControlCenterAlert } from "../../services/control-center";

const SEVERITY_STYLES: Record<string, { icon: typeof AlertTriangle; badge: string; border: string }> = {
  high: { icon: AlertTriangle, badge: "bg-red-100 text-red-700", border: "border-red-200 bg-red-50" },
  medium: { icon: AlertCircle, badge: "bg-amber-100 text-amber-700", border: "border-amber-200 bg-amber-50" },
  low: { icon: Info, badge: "bg-blue-100 text-blue-700", border: "border-blue-200 bg-blue-50" },
};

export default function AlertsPanel({ alerts }: { alerts: ControlCenterAlert[] }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Owner's Attention</h2>
      <p className="mt-1 text-sm text-slate-500">Everything that needs a decision, right now.</p>

      <div className="mt-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-700">
            <CheckCircle2 size={20} />
            <p className="text-sm font-medium">Nothing needs your attention — all clear.</p>
          </div>
        ) : (
          alerts.map((a) => {
            const style = SEVERITY_STYLES[a.severity] ?? SEVERITY_STYLES.low;
            const Icon = style.icon;
            return (
              <button
                key={`${a.category}-${a.link}-${a.message}`}
                onClick={() => navigate(a.link)}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition hover:-translate-y-0.5 ${style.border}`}
              >
                <Icon size={18} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.badge}`}>{a.category}</span>
                  <p className="mt-1 text-sm font-medium text-slate-700">{a.message}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
