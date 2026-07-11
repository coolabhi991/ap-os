import { useEffect, useState } from "react";
import { History, Save, Plus, Trash2 } from "lucide-react";
import {
  getSiteRecapLive,
  listSiteRecapRevisions,
  createSiteRecapRevision,
  getRecapitulationDraft,
  GST_TYPES,
  GST_TYPE_LABELS,
} from "../../../services/site-control-center";
import type { SiteRecapLive, SiteRecapRevision, RecapitulationItem, OtherCharge } from "../../../services/site-control-center";
import type { Site } from "../../../services/sites";
import LoadingState from "../../ui/LoadingState";
import { formatCurrency as inr } from "../../../lib/utils";
import EmptyTableRow from "../../ui/EmptyTableRow";

function RecapSnapshotView({ snapshot }: { snapshot: SiteRecapLive }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Budget</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{inr(snapshot.budget)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Actual</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{inr(snapshot.actual)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Difference</p>
          <p className={`mt-1 text-lg font-bold ${Number(snapshot.difference) < 0 ? "text-red-600" : "text-emerald-600"}`}>{inr(snapshot.difference)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Physical / Financial Progress</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{snapshot.physicalProgress}% / {snapshot.financialProgress}%</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Sub Work</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Budget</th>
              <th className="px-4 py-3 text-right">Actual</th>
              <th className="px-4 py-3 text-right">Difference</th>
              <th className="px-4 py-3 text-right">Physical %</th>
              <th className="px-4 py-3 text-right">Financial %</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.subWorks.length === 0 ? (
              <EmptyTableRow colSpan={7}>No Sub Works yet.</EmptyTableRow>
            ) : (
              snapshot.subWorks.map((sw) => (
                <tr key={sw.subWorkId} className="border-t">
                  <td className="px-4 py-3 font-medium">{sw.name}</td>
                  <td className="px-4 py-3">{sw.status}</td>
                  <td className="px-4 py-3 text-right">{inr(sw.budget)}</td>
                  <td className="px-4 py-3 text-right">{inr(sw.actual)}</td>
                  <td className={`px-4 py-3 text-right ${Number(sw.difference) < 0 ? "text-red-600" : "text-emerald-600"}`}>{inr(sw.difference)}</td>
                  <td className="px-4 py-3 text-right">{sw.physicalProgress}%</td>
                  <td className="px-4 py-3 text-right">{sw.financialProgress}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Read-only view of a saved Recapitulation Sheet — Sr No/Particular/Qty/Rate/Amount, then
 * Total/GST/Administration/Other Charges/Grand Total below, exactly as it was saved. */
function RecapBOQReadView({ revision }: { revision: SiteRecapRevision }) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Sr No</th>
              <th className="px-4 py-3 text-left">Particular</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Rate</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {revision.items.length === 0 ? (
              <EmptyTableRow colSpan={5}>No Sub Works on this Site yet.</EmptyTableRow>
            ) : (
              revision.items.map((it, i) => (
                <tr key={it.id ?? i} className="border-t">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{it.particular}</td>
                  <td className="px-4 py-3 text-right">{it.qty}</td>
                  <td className="px-4 py-3 text-right">{inr(it.rate)}</td>
                  <td className="px-4 py-3 text-right">{inr(it.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="ml-auto max-w-sm space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex justify-between text-sm"><span className="text-slate-500">Total</span><span className="font-medium">{inr(revision.subTotal)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">GST ({GST_TYPE_LABELS[revision.gstType] ?? revision.gstType}{revision.gstType === "CUSTOM" ? ` — ${revision.gstPercent}%` : ""})</span><span className="font-medium">{inr(revision.gstAmount)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">Administration Charges</span><span className="font-medium">{inr(revision.administrationCharges)}</span></div>
        {revision.otherCharges.map((c, i) => (
          <div key={i} className="flex justify-between text-sm"><span className="text-slate-500">{c.label}</span><span className="font-medium">{inr(c.amount)}</span></div>
        ))}
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base"><span className="font-bold text-slate-900">Grand Total</span><span className="font-bold text-slate-900">{inr(revision.grandTotal)}</span></div>
      </div>
    </div>
  );
}

interface EditableCharge extends OtherCharge {
  key: number;
}
let chargeKeySeq = 0;

/** The Add/Edit Recapitulation Sheet form — rows always come from the Site's current Sub Works
 * (never hand-added/removed), Qty/Rate editable, Amount computed live client-side (and always
 * re-verified server-side on save). */
function RecapBOQEditForm({
  siteId,
  onSaved,
  onCancel,
}: {
  siteId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [items, setItems] = useState<RecapitulationItem[]>([]);
  const [gstType, setGstType] = useState("NONE");
  const [gstPercent, setGstPercent] = useState(0);
  const [administrationCharges, setAdministrationCharges] = useState(0);
  const [otherCharges, setOtherCharges] = useState<EditableCharge[]>([]);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRecapitulationDraft(siteId)
      .then((draft) => {
        setItems(draft.items);
        setGstType(draft.gstType);
        setGstPercent(Number(draft.gstPercent));
        setAdministrationCharges(Number(draft.administrationCharges));
        setOtherCharges(draft.otherCharges.map((c) => ({ ...c, key: ++chargeKeySeq })));
      })
      .catch(() => setError("Failed to load the Recapitulation draft."))
      .finally(() => setLoading(false));
  }, [siteId]);

  const updateItem = (index: number, patch: Partial<RecapitulationItem>) => {
    setItems((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch, amount: String((Number(patch.qty ?? r.qty) || 0) * (Number(patch.rate ?? r.rate) || 0)) } : r)));
  };

  const addCharge = () => setOtherCharges((c) => [...c, { key: ++chargeKeySeq, label: "", amount: "0" }]);
  const updateCharge = (key: number, patch: Partial<OtherCharge>) => setOtherCharges((c) => c.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  const removeCharge = (key: number) => setOtherCharges((c) => c.filter((row) => row.key !== key));

  const subTotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const effectiveGstPercent = gstType === "CUSTOM" ? gstPercent : { NONE: 0, FIVE: 5, TWELVE: 12, EIGHTEEN: 18 }[gstType] ?? 0;
  const gstAmount = subTotal * (effectiveGstPercent / 100);
  const otherChargesTotal = otherCharges.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const grandTotal = subTotal + gstAmount + administrationCharges + otherChargesTotal;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createSiteRecapRevision(siteId, {
        label: label || undefined,
        notes: notes || undefined,
        items: items.map((i) => ({ subWorkId: i.subWorkId || undefined, particular: i.particular, qty: Number(i.qty) || 0, rate: Number(i.rate) || 0 })),
        gstType,
        gstPercent: gstType === "CUSTOM" ? gstPercent : undefined,
        administrationCharges,
        otherCharges: otherCharges.filter((c) => c.label.trim()).map(({ label: l, amount }) => ({ label: l, amount })),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save the Recapitulation Sheet.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Sr No</th>
              <th className="px-4 py-3 text-left">Particular</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Rate</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <EmptyTableRow colSpan={5}>Add a Sub Work to this Site first — Recapitulation rows come from Sub Works.</EmptyTableRow>
            ) : (
              items.map((it, i) => (
                <tr key={it.subWorkId || i} className="border-t">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{it.particular}</td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number" min={0} step="0.0001"
                      value={it.qty}
                      onChange={(e) => updateItem(i, { qty: e.target.value })}
                      className="w-28 rounded-lg border p-2 text-right text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number" min={0} step="0.01"
                      value={it.rate}
                      onChange={(e) => updateItem(i, { rate: e.target.value })}
                      className="w-28 rounded-lg border p-2 text-right text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{inr(it.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Other Charges</h3>
            <button type="button" onClick={addCharge} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50">
              <Plus className="h-3.5 w-3.5" /> Add Charge
            </button>
          </div>
          {otherCharges.length === 0 ? (
            <p className="text-xs text-slate-400">No other charges added.</p>
          ) : (
            otherCharges.map((c) => (
              <div key={c.key} className="flex items-center gap-2">
                <input placeholder="Label" value={c.label} onChange={(e) => updateCharge(c.key, { label: e.target.value })} className="flex-1 rounded-lg border p-2 text-sm" />
                <input type="number" min={0} step="0.01" value={c.amount} onChange={(e) => updateCharge(c.key, { amount: e.target.value })} className="w-28 rounded-lg border p-2 text-right text-sm" />
                <button type="button" onClick={() => removeCharge(c.key)} className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium">GST</label>
            <div className="flex items-center gap-2">
              <select value={gstType} onChange={(e) => setGstType(e.target.value)} className="flex-1 rounded-lg border p-2.5 text-sm">
                {GST_TYPES.map((t) => <option key={t} value={t}>{GST_TYPE_LABELS[t]}</option>)}
              </select>
              {gstType === "CUSTOM" && (
                <input type="number" min={0} step="0.01" value={gstPercent} onChange={(e) => setGstPercent(Number(e.target.value) || 0)} className="w-24 rounded-lg border p-2.5 text-sm" placeholder="%" />
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Administration Charges</label>
            <input type="number" min={0} step="0.01" value={administrationCharges} onChange={(e) => setAdministrationCharges(Number(e.target.value) || 0)} className="w-full rounded-lg border p-2.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Label</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. As per site inspection" className="w-full rounded-lg border p-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border p-2.5 text-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="ml-auto max-w-sm space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex justify-between text-sm"><span className="text-slate-500">Total</span><span className="font-medium">{inr(subTotal)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">GST ({effectiveGstPercent}%)</span><span className="font-medium">{inr(gstAmount)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">Administration Charges</span><span className="font-medium">{inr(administrationCharges)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">Other Charges</span><span className="font-medium">{inr(otherChargesTotal)}</span></div>
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base"><span className="font-bold text-slate-900">Grand Total</span><span className="font-bold text-slate-900">{inr(grandTotal)}</span></div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-lg border px-5 py-2.5">Cancel</button>
        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60">
          <Save size={16} /> {saving ? "Saving..." : "Save Revision"}
        </button>
      </div>
    </form>
  );
}

export default function RecapitulationTab({ site }: { site: Site }) {
  const [live, setLive] = useState<SiteRecapLive | null>(null);
  const [revisions, setRevisions] = useState<SiteRecapRevision[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<SiteRecapRevision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showLegacyView, setShowLegacyView] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getSiteRecapLive(site.id), listSiteRecapRevisions(site.id)])
      .then(([liveData, revisionData]) => {
        setLive(liveData);
        setRevisions(revisionData);
      })
      .catch(() => setError("Failed to load recapitulation sheet."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [site.id]);

  if (loading) return <LoadingState />;
  if (error || !live) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  const currentRevision = revisions.find((r) => r.isCurrent) ?? null;

  if (editing) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">{currentRevision ? "Edit Recapitulation Sheet" : "Add Recapitulation Sheet"}</h2>
        <RecapBOQEditForm siteId={site.id} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />
      </div>
    );
  }

  if (!currentRevision) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
        <p className="mb-4 text-slate-500">No Recapitulation Sheet yet for this Site.</p>
        <button onClick={() => setEditing(true)} className="mx-auto flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
          <Plus size={18} /> Add Recapitulation Sheet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Recapitulation Sheet</h2>
          <p className="text-sm text-slate-500">
            Current revision: #{currentRevision.revisionNo}{currentRevision.label ? ` — ${currentRevision.label}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory((v) => !v)} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
            <History size={16} /> Revision History ({revisions.length})
          </button>
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            <Save size={16} /> Save New Revision
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Revision</th>
                <th className="px-4 py-3 text-left">Label</th>
                <th className="px-4 py-3 text-left">Saved By</th>
                <th className="px-4 py-3 text-left">Saved At</th>
                <th className="px-4 py-3 text-left">Current</th>
                <th className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {revisions.length === 0 ? (
                <EmptyTableRow colSpan={6}>No revisions saved yet.</EmptyTableRow>
              ) : (
                revisions.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3 font-medium">#{r.revisionNo}</td>
                    <td className="px-4 py-3">{r.label || "—"}</td>
                    <td className="px-4 py-3">{r.createdByName || "—"}</td>
                    <td className="px-4 py-3">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{r.isCurrent && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Current</span>}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelectedRevision(r)} className="text-blue-600 hover:underline">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedRevision ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Revision #{selectedRevision.revisionNo}{selectedRevision.label ? ` — ${selectedRevision.label}` : ""}</h3>
            <button onClick={() => setSelectedRevision(null)} className="text-sm text-blue-600 hover:underline">Back to Current</button>
          </div>
          <RecapBOQReadView revision={selectedRevision} />
        </div>
      ) : (
        <RecapBOQReadView revision={currentRevision} />
      )}

      <div>
        <button onClick={() => setShowLegacyView((v) => !v)} className="text-sm text-blue-600 hover:underline">
          {showLegacyView ? "Hide" : "Show"} Budget vs Actual (Cost Heads)
        </button>
        {showLegacyView && <div className="mt-3"><RecapSnapshotView snapshot={live} /></div>}
      </div>
    </div>
  );
}
