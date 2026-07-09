import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  getSubWorkRecap,
  getSubWorkDrillDown,
  COST_HEAD_LABELS,
  VARIANCE_STATUS_LABELS,
  VARIANCE_STATUS_COLORS,
} from "../../services/project-control-center";
import type { SubWorkRecap, CostHeadKey, DrillDownData } from "../../services/project-control-center";
import DrillDownPanel from "./DrillDownPanel";

interface Props {
  subWorkId: string;
  onClose: () => void;
}

const HEAD_KEYS: CostHeadKey[] = ["material", "labour", "machinery", "fuel", "vendorBills", "siteExpenses", "other"];

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

function Stat({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  const color = tone === "negative" ? "text-red-600" : tone === "positive" ? "text-emerald-600" : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function RecapSheet({ subWorkId, onClose }: Props) {
  const [recap, setRecap] = useState<SubWorkRecap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drillHead, setDrillHead] = useState<CostHeadKey | null>(null);
  const [drillData, setDrillData] = useState<DrillDownData | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSubWorkRecap(subWorkId)
      .then(setRecap)
      .catch(() => setError("Failed to load recapitulation sheet."))
      .finally(() => setLoading(false));
  }, [subWorkId]);

  const openDrillDown = async (head: CostHeadKey) => {
    setDrillHead(head);
    setDrillData(null);
    setDrillLoading(true);
    try {
      const data = await getSubWorkDrillDown(subWorkId, head);
      setDrillData(data);
    } finally {
      setDrillLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Recapitulation Sheet{recap ? `: ${recap.subWork.name}` : ""}</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        {loading && <div className="py-10 text-center text-slate-500">Loading...</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

        {recap && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat label="Budget" value={inr(recap.budget)} />
              <Stat label="Actual" value={inr(recap.actual)} />
              <Stat label="Difference" value={inr(recap.difference)} tone={Number(recap.difference) < 0 ? "negative" : "positive"} />
              <Stat label="Physical Progress" value={`${recap.physicalProgress}%`} />
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Stat label="Financial Progress" value={`${recap.financialProgress}%`} />
              <Stat label="Variance" value={`${recap.variance > 0 ? "+" : ""}${recap.variance} pts`} tone={recap.variance < 0 ? "negative" : "positive"} />
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Status</p>
                <p className="mt-1">
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${VARIANCE_STATUS_COLORS[recap.varianceStatus]}`}>
                    {VARIANCE_STATUS_LABELS[recap.varianceStatus]}
                  </span>
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full">
                <thead className="bg-slate-100">
                  <tr><th className="px-4 py-3 text-left">Cost Head</th><th className="px-4 py-3 text-right">Amount</th></tr>
                </thead>
                <tbody>
                  {HEAD_KEYS.map((key) => (
                    <tr key={key} className="border-t">
                      <td className="px-4 py-3">
                        <button onClick={() => openDrillDown(key)} className="font-medium text-blue-600 hover:underline">
                          {COST_HEAD_LABELS[key]}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">{inr(recap.costHeads[key])}</td>
                    </tr>
                  ))}
                  <tr className="border-t bg-slate-50 font-bold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">{inr(recap.costHeads.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {drillHead && (
          <DrillDownPanel
            head={drillHead}
            data={drillData}
            loading={drillLoading}
            onClose={() => {
              setDrillHead(null);
              setDrillData(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
