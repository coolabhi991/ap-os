import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getSubWorksBySite } from "../../../services/sub-works";
import type { SubWork } from "../../../services/sub-works";
import { getSiteBoqItems, createSiteBoqItem, updateSiteBoqItem, deleteSiteBoqItem } from "../../../services/site-boq-items";
import type { SiteBoqItem, SiteBoqItemFormData } from "../../../services/site-boq-items";
import type { Site } from "../../../services/sites";
import { formatCurrency as inr } from "../../../lib/utils";
import LoadingState from "../../ui/LoadingState";

interface FormState {
  id?: string;
  description: string;
  unit: string;
  contractQuantity: string;
  rate: string;
  remarks: string;
}

const emptyForm: FormState = { description: "", unit: "", contractQuantity: "", rate: "", remarks: "" };

export default function BOQTab({ site }: { site: Site }) {
  const [subWorks, setSubWorks] = useState<SubWork[]>([]);
  const [items, setItems] = useState<SiteBoqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formSubWorkId, setFormSubWorkId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([getSubWorksBySite(site.id), getSiteBoqItems(site.id)])
      .then(([sw, boq]) => {
        setSubWorks(sw);
        setItems(boq);
      })
      .catch(() => setError("Failed to load BOQ."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [site.id]);

  const openAdd = (subWorkId: string) => {
    setFormSubWorkId(subWorkId);
    setForm(emptyForm);
    setFormError(null);
  };

  const openEdit = (subWorkId: string, item: SiteBoqItem) => {
    setFormSubWorkId(subWorkId);
    setForm({ id: item.id, description: item.description, unit: item.unit, contractQuantity: item.contractQuantity, rate: item.rate, remarks: item.remarks });
    setFormError(null);
  };

  const closeForm = () => {
    setFormSubWorkId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleSave = async (subWorkId: string) => {
    if (!form.description.trim() || !form.unit.trim()) {
      setFormError("Item Description and Unit are required.");
      return;
    }
    const payload: SiteBoqItemFormData = {
      siteId: site.id,
      subWorkId,
      description: form.description,
      unit: form.unit,
      contractQuantity: Number(form.contractQuantity) || 0,
      rate: Number(form.rate) || 0,
      remarks: form.remarks || undefined,
    };
    setSaving(true);
    setFormError(null);
    try {
      if (form.id) {
        await updateSiteBoqItem(form.id, payload);
      } else {
        await createSiteBoqItem(payload);
      }
      closeForm();
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save BOQ item.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this BOQ item?")) return;
    await deleteSiteBoqItem(id);
    load();
  };

  if (loading) return <LoadingState label="Loading BOQ..." />;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">BOQ (Bill of Quantities)</h2>
        <p className="mt-1 text-sm text-slate-500">
          Optional contract item catalog, organized Sub Work wise — used only to speed up Form No. 58 data entry via "Import From BOQ". Not raising bills against these items directly is fine; Form No. 58 works exactly the same with or without a BOQ.
        </p>
      </div>

      {subWorks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500 shadow-sm">
          No Sub Works yet for this Site — add Sub Works via the Recapitulation tab first, then return here to build the BOQ.
        </div>
      ) : (
        <div className="space-y-6">
          {subWorks.map((sw) => {
            const swItems = items.filter((i) => i.subWorkId === sw.id);
            const isAdding = formSubWorkId === sw.id;
            return (
              <div key={sw.id} className="overflow-hidden rounded-lg border border-slate-200">
                <div className="flex items-center justify-between bg-slate-800 px-3 py-2 text-sm font-semibold text-white">
                  <span>{sw.name}</span>
                  {!isAdding && (
                    <button type="button" onClick={() => openAdd(sw.id)} className="flex items-center gap-1 rounded border border-white/40 px-2 py-1 text-xs hover:bg-white/10">
                      <Plus className="h-3 w-3" /> Add BOQ Item
                    </button>
                  )}
                </div>

                {isAdding && (
                  <div className="border-b border-slate-200 bg-slate-50 p-4">
                    {formError && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}
                    <div className="grid gap-3 md:grid-cols-5">
                      <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Item Description" className="rounded-lg border p-2 md:col-span-2" />
                      <input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="Unit" className="rounded-lg border p-2" />
                      <input type="number" min={0} step="0.0001" value={form.contractQuantity} onChange={(e) => setForm((f) => ({ ...f, contractQuantity: e.target.value }))} placeholder="Contract Qty" className="rounded-lg border p-2 text-right" />
                      <input type="number" min={0} step="0.01" value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} placeholder="Rate" className="rounded-lg border p-2 text-right" />
                      <input value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} placeholder="Remarks" className="rounded-lg border p-2 md:col-span-4" />
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => handleSave(sw.id)} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60">
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button type="button" onClick={closeForm} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-100">Cancel</button>
                      </div>
                    </div>
                  </div>
                )}

                {swItems.length === 0 && !isAdding ? (
                  <p className="px-4 py-4 text-sm text-slate-400">No BOQ items yet in this Sub Work.</p>
                ) : (
                  swItems.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-3 py-2 text-left">Item Description</th>
                            <th className="px-3 py-2 text-left">Unit</th>
                            <th className="px-3 py-2 text-right">Contract Qty</th>
                            <th className="px-3 py-2 text-right">Rate</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                            <th className="px-3 py-2 text-left">Remarks</th>
                            <th className="px-3 py-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {swItems.map((item) => (
                            <tr key={item.id} className="border-t">
                              <td className="px-3 py-2">{item.description}</td>
                              <td className="px-3 py-2">{item.unit}</td>
                              <td className="px-3 py-2 text-right">{Number(item.contractQuantity).toFixed(4)}</td>
                              <td className="px-3 py-2 text-right">{inr(item.rate)}</td>
                              <td className="px-3 py-2 text-right font-medium">{inr(item.amount)}</td>
                              <td className="px-3 py-2 text-slate-500">{item.remarks || "—"}</td>
                              <td className="px-3 py-2">
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => openEdit(sw.id, item)} title="Edit"><Pencil size={14} className="text-emerald-600" /></button>
                                  <button onClick={() => handleDelete(item.id)} title="Delete"><Trash2 size={14} className="text-red-600" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
