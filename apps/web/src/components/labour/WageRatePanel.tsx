import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { getLabourWageRates, createLabourWageRate } from "../../services/labour-wage-rates";
import type { LabourWageRate, LabourWageRateFormData } from "../../services/labour-wage-rates";
import { todayISO } from "../../lib/utils";

interface Props {
  labourId: string;
  onRateAdded?: () => void;
}

const emptyForm: LabourWageRateFormData = {
  dailyWage: 0,
  overtimeRate: 0,
  effectiveFrom: todayISO(),
};

export default function WageRatePanel({ labourId, onRateAdded }: Props) {
  const [rates, setRates] = useState<LabourWageRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LabourWageRateFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setRates(await getLabourWageRates(labourId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labourId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.dailyWage || form.dailyWage <= 0) {
      setError("Daily wage must be greater than zero.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await createLabourWageRate(labourId, form);
      setForm(emptyForm);
      setShowForm(false);
      await load();
      onRateAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add wage rate.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold">Wage Rate History</h2>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Plus size={16} /> Add Rate Change
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Effective From</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Daily Wage</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Overtime Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rates.length === 0 ? (
                <tr><td colSpan={3} className="py-6 text-center text-slate-500">No wage rate set yet.</td></tr>
              ) : (
                rates.map((r, i) => (
                  <tr key={r.id} className={i === 0 ? "bg-emerald-50" : ""}>
                    <td className="px-4 py-3">{r.effectiveFrom} {i === 0 && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Current</span>}</td>
                    <td className="px-4 py-3 text-right">₹{Number(r.dailyWage).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right">₹{Number(r.overtimeRate).toLocaleString("en-IN")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-lg border border-slate-200 p-5">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Daily Wage *</label>
              <input type="number" min={0} step="0.01" value={form.dailyWage} onChange={(e) => setForm({ ...form, dailyWage: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Overtime Rate</label>
              <input type="number" min={0} step="0.01" value={form.overtimeRate} onChange={(e) => setForm({ ...form, overtimeRate: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Effective From</label>
              <input type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} className="w-full rounded-lg border p-2.5" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Save Rate"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
