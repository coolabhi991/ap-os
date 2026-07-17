import { Check } from "lucide-react";

const STAGES = ["Draft", "Submitted", "Certified", "Payment Due", "Partially Paid", "Paid"];

/**
 * Presentational-only 6-stage lifecycle narrative over the actual 5-value BillStatus enum
 * (DRAFT/SUBMITTED/PASSED/PARTLY_PAID/FULLY_PAID) — "Certified" and "Payment Due" are both the
 * PASSED status at two different moments (the certification action, then the ensuing wait for
 * payment); deriveRunningBillStatus (running-bill.service.ts) already guarantees a PASSED bill
 * always has amountReceived === 0, so PASSED bills are shown resting at "Payment Due" with
 * "Certified" marked already-reached. No schema change, no new status values.
 */
function stageIndex(status: string): number {
  switch (status) {
    case "DRAFT": return 0;
    case "SUBMITTED": return 1;
    case "PASSED": return 3;
    case "PARTLY_PAID": return 4;
    case "FULLY_PAID": return 5;
    default: return 0;
  }
}

export default function RunningBillLifecycle({ status }: { status: string }) {
  const active = stageIndex(status);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center">
        {STAGES.map((label, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    done ? "bg-emerald-500 text-white" : current ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done ? <Check size={16} /> : i + 1}
                </div>
                <span className={`whitespace-nowrap text-xs font-medium ${current ? "text-blue-700" : done ? "text-emerald-700" : "text-slate-400"}`}>
                  {label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`mx-2 h-0.5 flex-1 ${i < active ? "bg-emerald-500" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
