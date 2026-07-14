import { useEffect, useRef, useState } from "react";
import { History, Plus, Trash2, ArrowUp, ArrowDown, CornerDownRight } from "lucide-react";
import {
  getCurrentSiteRecapRevision,
  listSiteRecapRevisions,
  addRecapItem,
  updateRecapItem,
  deleteRecapItem,
  reorderRecapItems,
  updateRecapCharges,
  GST_TYPES,
  GST_TYPE_LABELS,
  RECAP_UNIT_OPTIONS,
} from "../../../services/site-control-center";
import type { SiteRecapRevision, RecapitulationItem } from "../../../services/site-control-center";
import type { Site } from "../../../services/sites";
import LoadingState from "../../ui/LoadingState";
import { formatCurrency as inr } from "../../../lib/utils";
import EmptyTableRow from "../../ui/EmptyTableRow";

const inputClass = "w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

interface DraftRow {
  particular: string;
  unit: string;
  qty: string;
  rate: string;
  afterItemId?: string;
}
const emptyDraft = (afterItemId?: string): DraftRow => ({ particular: "", unit: "", qty: "0", rate: "0", afterItemId });

/**
 * The Recapitulation Register — the Site's primary planning/costing/execution grid (Site
 * Management & Financial Workflow Refinement milestone). Rows are directly Added/Inserted/
 * Deleted/Reordered/Inline-edited here; there is no separate Sub Works tab anymore — adding a
 * row here transparently creates the linked Sub Work every other module already tags against.
 */
export default function RecapitulationTab({ site }: { site: Site }) {
  const [revision, setRevision] = useState<SiteRecapRevision | null>(null);
  const [revisions, setRevisions] = useState<SiteRecapRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyView, setHistoryView] = useState<SiteRecapRevision | null>(null);

  const [draft, setDraft] = useState<DraftRow | null>(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);
  // Bumped only when a brand-new draft row is created (startAddRow, or "Save & continue" opening
  // the next blank row) — never by editing an existing draft's fields. `draft` itself is a new
  // object on every keystroke (each onChange spreads {...d, field: value}), so keying the
  // focus-the-Particular-field effect off `draft` directly stole focus back to Particular on
  // every keystroke in any draft field, including Rate — this counter is the actual "a new row
  // just appeared" signal the effect needs.
  const [draftGeneration, setDraftGeneration] = useState(0);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<{ particular: string; unit: string; qty: string; rate: string } | null>(null);
  const [editingError, setEditingError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([getCurrentSiteRecapRevision(site.id), listSiteRecapRevisions(site.id)])
      .then(([current, revs]) => {
        setRevision(current);
        setRevisions(revs);
      })
      .catch(() => setError("Failed to load the Recapitulation Register."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [site.id]);
  useEffect(() => {
    if (draft) requestAnimationFrame(() => draftInputRef.current?.focus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftGeneration]);

  if (loading) return <LoadingState />;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  const items = revision?.items ?? [];

  const startAddRow = (afterItemId?: string) => {
    setDraft(emptyDraft(afterItemId));
    setDraftGeneration((g) => g + 1);
  };

  const saveDraft = async (continueEntry: boolean) => {
    if (!draft) return;
    if (!draft.particular.trim()) {
      setDraftError("Particular is required.");
      return;
    }
    setDraftSaving(true);
    setDraftError(null);
    try {
      const updated = await addRecapItem(site.id, {
        particular: draft.particular,
        unit: draft.unit || undefined,
        qty: Number(draft.qty) || 0,
        rate: Number(draft.rate) || 0,
        afterItemId: draft.afterItemId,
      });
      setRevision(updated);
      if (continueEntry) {
        setDraft(emptyDraft());
        setDraftGeneration((g) => g + 1);
      } else {
        setDraft(null);
      }
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Failed to add row.");
    } finally {
      setDraftSaving(false);
    }
  };

  const startEdit = (item: RecapitulationItem) => {
    setEditingId(item.id ?? null);
    setEditingData({ particular: item.particular, unit: item.unit, qty: item.qty, rate: item.rate });
    setEditingError(null);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
    setEditingError(null);
  };
  const saveEdit = async () => {
    if (!editingId || !editingData) return;
    if (!editingData.particular.trim()) {
      setEditingError("Particular is required.");
      return;
    }
    try {
      const updated = await updateRecapItem(editingId, {
        particular: editingData.particular,
        unit: editingData.unit || undefined,
        qty: Number(editingData.qty) || 0,
        rate: Number(editingData.rate) || 0,
      });
      setRevision(updated);
      cancelEdit();
    } catch (err) {
      setEditingError(err instanceof Error ? err.message : "Failed to save row.");
    }
  };

  const handleDelete = async (item: RecapitulationItem) => {
    if (!window.confirm(`Delete "${item.particular}"?`)) return;
    const updated = await deleteRecapItem(site.id, item.id!);
    setRevision(updated);
  };

  const moveRow = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    const updated = await reorderRecapItems(site.id, [
      { id: a.id!, sortOrder: b.sortOrder },
      { id: b.id!, sortOrder: a.sortOrder },
    ]);
    setRevision(updated);
  };

  const handleDraftKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveDraft(true);
    } else if (e.key === "Escape") {
      setDraft(null);
    }
  };
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Recapitulation Register</h2>
          <p className="text-sm text-slate-500">The Site's primary planning, costing and execution grid.</p>
        </div>
        <button onClick={() => setShowHistory((v) => !v)} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
          <History size={16} /> Revision History ({revisions.length})
        </button>
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
                <th className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {revisions.length === 0 ? (
                <EmptyTableRow colSpan={5}>No locked revisions yet — the live grid below is always the current state.</EmptyTableRow>
              ) : (
                revisions.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3 font-medium">#{r.revisionNo}{r.isCurrent && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Current</span>}</td>
                    <td className="px-4 py-3">{r.label || "—"}</td>
                    <td className="px-4 py-3">{r.createdByName || "—"}</td>
                    <td className="px-4 py-3">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setHistoryView(r)} className="text-blue-600 hover:underline">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {historyView && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Historical Revision #{historyView.revisionNo}{historyView.label ? ` — ${historyView.label}` : ""}</h3>
            <button onClick={() => setHistoryView(null)} className="text-sm text-blue-600 hover:underline">Close</button>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr><th className="px-3 py-2 text-left">Sr No</th><th className="px-3 py-2 text-left">Particular</th><th className="px-3 py-2 text-left">Unit</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Rate</th><th className="px-3 py-2 text-right">Amount</th></tr>
              </thead>
              <tbody>
                {historyView.items.map((it, i) => (
                  <tr key={it.id ?? i} className="border-t">
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{it.particular}</td>
                    <td className="px-3 py-2">{it.unit || "—"}</td>
                    <td className="px-3 py-2 text-right">{it.qty}</td>
                    <td className="px-3 py-2 text-right">{inr(it.rate)}</td>
                    <td className="px-3 py-2 text-right">{inr(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm font-medium text-slate-700">Grand Total: {inr(historyView.grandTotal)}</p>
        </div>
      )}

      {/* The live grid */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="w-16 px-3 py-2.5 text-left font-medium text-slate-600">Sr No</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Particular</th>
              <th className="w-28 px-3 py-2.5 text-left font-medium text-slate-600">Unit</th>
              <th className="w-28 px-3 py-2.5 text-right font-medium text-slate-600">Qty</th>
              <th className="w-32 px-3 py-2.5 text-right font-medium text-slate-600">Rate</th>
              <th className="w-32 px-3 py-2.5 text-right font-medium text-slate-600">Amount</th>
              <th className="w-40 px-3 py-2.5 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !draft && (
              <EmptyTableRow colSpan={7}>No rows yet. Click "Add Row" to start.</EmptyTableRow>
            )}
            {items.map((item, index) => {
              const isEditing = editingId === item.id;
              return (
                <tr key={item.id} className={`border-t ${isEditing ? "bg-blue-50/50" : "hover:bg-slate-50"}`} onKeyDown={isEditing ? handleEditKeyDown : undefined}>
                  <td className="px-3 py-2 text-slate-500">{index + 1}</td>
                  <td className="px-3 py-2">
                    {isEditing && editingData ? (
                      <input autoFocus className={inputClass} value={editingData.particular} onChange={(e) => setEditingData((d) => (d ? { ...d, particular: e.target.value } : d))} />
                    ) : (
                      <span className="font-medium text-slate-800">{item.particular}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isEditing && editingData ? (
                      <select className={inputClass} value={editingData.unit} onChange={(e) => setEditingData((d) => (d ? { ...d, unit: e.target.value } : d))}>
                        <option value="">—</option>
                        {RECAP_UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    ) : (
                      item.unit || "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {isEditing && editingData ? (
                      <input type="number" step="0.0001" className={`${inputClass} text-right`} value={editingData.qty} onChange={(e) => setEditingData((d) => (d ? { ...d, qty: e.target.value } : d))} />
                    ) : (
                      item.qty
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {isEditing && editingData ? (
                      <input type="number" step="0.01" className={`${inputClass} text-right`} value={editingData.rate} onChange={(e) => setEditingData((d) => (d ? { ...d, rate: e.target.value } : d))} />
                    ) : (
                      inr(item.rate)
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">{isEditing ? inr((Number(editingData?.qty) || 0) * (Number(editingData?.rate) || 0)) : inr(item.amount)}</td>
                  <td className="px-3 py-2 text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-1.5">
                        <button onClick={saveEdit} className="rounded border px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50">Save</button>
                        <button onClick={cancelEdit} className="rounded border px-2 py-1 text-xs text-slate-500 hover:bg-slate-100">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => moveRow(index, -1)} disabled={index === 0} title="Move Up" className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => moveRow(index, 1)} disabled={index === items.length - 1} title="Move Down" className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => startAddRow(item.id)} title="Insert Row Below" className="rounded p-1.5 text-blue-600 hover:bg-blue-50">
                          <CornerDownRight className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => startEdit(item)} title="Edit" className="rounded p-1.5 text-blue-600 hover:bg-blue-50">
                          <span className="text-xs">Edit</span>
                        </button>
                        <button onClick={() => handleDelete(item)} title="Delete Row" className="rounded p-1.5 text-red-600 hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {editingError && (
              <tr><td colSpan={7} className="px-3 pb-2 pt-0 text-xs text-red-600">{editingError}</td></tr>
            )}

            {draft && (
              <tr className="border-t bg-amber-50/40" onKeyDown={handleDraftKeyDown}>
                <td className="px-3 py-2 text-slate-400">{items.length + 1}</td>
                <td className="px-3 py-2">
                  <input ref={draftInputRef} className={inputClass} placeholder="Particular" value={draft.particular} onChange={(e) => setDraft((d) => (d ? { ...d, particular: e.target.value } : d))} />
                </td>
                <td className="px-3 py-2">
                  <select className={inputClass} value={draft.unit} onChange={(e) => setDraft((d) => (d ? { ...d, unit: e.target.value } : d))}>
                    <option value="">—</option>
                    {RECAP_UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2 text-right">
                  <input type="number" step="0.0001" className={`${inputClass} text-right`} value={draft.qty} onChange={(e) => setDraft((d) => (d ? { ...d, qty: e.target.value } : d))} />
                </td>
                <td className="px-3 py-2 text-right">
                  <input type="number" step="0.01" className={`${inputClass} text-right`} value={draft.rate} onChange={(e) => setDraft((d) => (d ? { ...d, rate: e.target.value } : d))} />
                </td>
                <td className="px-3 py-2 text-right font-medium">{inr((Number(draft.qty) || 0) * (Number(draft.rate) || 0))}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => saveDraft(false)} disabled={draftSaving} className="rounded border px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">Save</button>
                    <button onClick={() => setDraft(null)} className="rounded border px-2 py-1 text-xs text-slate-500 hover:bg-slate-100">Cancel</button>
                  </div>
                </td>
              </tr>
            )}
            {draftError && (
              <tr><td colSpan={7} className="px-3 pb-2 pt-0 text-xs text-red-600">{draftError}</td></tr>
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot className="bg-slate-50">
              <tr className="border-t">
                <td colSpan={5} className="px-3 py-2 text-right font-semibold text-slate-700">Sub Total</td>
                <td className="px-3 py-2 text-right font-semibold text-slate-900">{inr(revision?.subTotal ?? 0)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {!draft && (
        <div className="flex items-center gap-3">
          <button onClick={() => startAddRow()} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Row
          </button>
          <span className="text-xs text-slate-400">Enter on the last row adds the next blank row automatically.</span>
        </div>
      )}

      <OtherChargesAndGstSection site={site} revision={revision} onUpdated={setRevision} />
    </div>
  );
}

function OtherChargesAndGstSection({
  site,
  revision,
  onUpdated,
}: {
  site: Site;
  revision: SiteRecapRevision | null;
  onUpdated: (r: SiteRecapRevision) => void;
}) {
  const [mseb, setMseb] = useState(revision?.msebCharges ?? "0");
  const [royalty, setRoyalty] = useState(revision?.royaltyCharges ?? "0");
  const [testing, setTesting] = useState(revision?.testingCharges ?? "0");
  const [labourCess, setLabourCess] = useState(revision?.labourCessCharges ?? "0");
  const [otherRecoveries, setOtherRecoveries] = useState(revision?.otherRecoveries ?? "0");
  const [administrationCharges, setAdministrationCharges] = useState(revision?.administrationCharges ?? "0");
  const [gstType, setGstType] = useState(revision?.gstType ?? "NONE");
  const [gstPercent, setGstPercent] = useState(revision?.gstPercent ?? "0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMseb(revision?.msebCharges ?? "0");
    setRoyalty(revision?.royaltyCharges ?? "0");
    setTesting(revision?.testingCharges ?? "0");
    setLabourCess(revision?.labourCessCharges ?? "0");
    setOtherRecoveries(revision?.otherRecoveries ?? "0");
    setAdministrationCharges(revision?.administrationCharges ?? "0");
    setGstType(revision?.gstType ?? "NONE");
    setGstPercent(revision?.gstPercent ?? "0");
  }, [revision]);

  const save = async (overrides: Partial<{ gstType: string; gstPercent: string }> = {}) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateRecapCharges(site.id, {
        msebCharges: Number(mseb) || 0,
        royaltyCharges: Number(royalty) || 0,
        testingCharges: Number(testing) || 0,
        labourCessCharges: Number(labourCess) || 0,
        otherRecoveries: Number(otherRecoveries) || 0,
        administrationCharges: Number(administrationCharges) || 0,
        gstType: overrides.gstType ?? gstType,
        gstPercent: Number(overrides.gstPercent ?? gstPercent) || 0,
      });
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update charges.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Other Charges</h3>
        <p className="text-sm text-slate-500">MSEB, Royalty, Testing, Labour Cess and Other Recoveries — a separate section below the Register.</p>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">MSEB Charges</label>
          <input type="number" step="0.01" className={inputClass} value={mseb} onChange={(e) => setMseb(e.target.value)} onBlur={() => save()} disabled={saving} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Royalty</label>
          <input type="number" step="0.01" className={inputClass} value={royalty} onChange={(e) => setRoyalty(e.target.value)} onBlur={() => save()} disabled={saving} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Testing Charges</label>
          <input type="number" step="0.01" className={inputClass} value={testing} onChange={(e) => setTesting(e.target.value)} onBlur={() => save()} disabled={saving} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Labour Cess</label>
          <input type="number" step="0.01" className={inputClass} value={labourCess} onChange={(e) => setLabourCess(e.target.value)} onBlur={() => save()} disabled={saving} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Other Recoveries</label>
          <input type="number" step="0.01" className={inputClass} value={otherRecoveries} onChange={(e) => setOtherRecoveries(e.target.value)} onBlur={() => save()} disabled={saving} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Administration Charges</label>
          <input type="number" step="0.01" className={inputClass} value={administrationCharges} onChange={(e) => setAdministrationCharges(e.target.value)} onBlur={() => save()} disabled={saving} />
        </div>
        <div className="flex items-end justify-between rounded-lg bg-slate-50 px-3 py-2 sm:col-span-2">
          <span className="text-sm text-slate-500">Other Charges Total</span>
          <span className="text-sm font-bold text-slate-900">{inr(revision?.otherChargesTotal ?? 0)}</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900">GST</h3>
        <p className="text-sm text-slate-500">A completely separate section below Other Charges.</p>
      </div>
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">GST Type</label>
          <select
            className={inputClass}
            value={gstType}
            onChange={(e) => {
              setGstType(e.target.value);
              save({ gstType: e.target.value });
            }}
          >
            {GST_TYPES.map((t) => <option key={t} value={t}>{GST_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        {gstType === "CUSTOM" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Custom GST %</label>
            <input type="number" step="0.01" className={inputClass} value={gstPercent} onChange={(e) => setGstPercent(e.target.value)} onBlur={() => save()} disabled={saving} />
          </div>
        )}
        <div className="ml-auto flex gap-6">
          <div className="text-right">
            <p className="text-xs text-slate-500">GST Amount</p>
            <p className="text-lg font-bold text-slate-900">{inr(revision?.gstAmount ?? 0)}</p>
          </div>
        </div>
      </div>

      <div className="ml-auto max-w-sm space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex justify-between text-sm"><span className="text-slate-500">Sub Total</span><span className="font-medium">{inr(revision?.subTotal ?? 0)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">Other Charges Total</span><span className="font-medium">{inr(revision?.otherChargesTotal ?? 0)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">Administration Charges</span><span className="font-medium">{inr(revision?.administrationCharges ?? 0)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">GST</span><span className="font-medium">{inr(revision?.gstAmount ?? 0)}</span></div>
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base"><span className="font-bold text-slate-900">Grand Total</span><span className="font-bold text-slate-900">{inr(revision?.grandTotal ?? 0)}</span></div>
      </div>
    </div>
  );
}
