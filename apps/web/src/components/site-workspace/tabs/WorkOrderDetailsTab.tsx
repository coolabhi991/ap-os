import { useEffect, useState } from "react";
import { History, Plus, Eye, Download } from "lucide-react";
import type { Site, TenderPercentChangeLogEntry } from "../../../services/sites";
import { updateSite, getTenderPercentChangeLog } from "../../../services/sites";
import type { WorkOrderExtension } from "../../../services/work-order-extensions";
import {
  getWorkOrderExtensions,
  createWorkOrderExtension,
  previewWorkOrderExtensionFile,
  downloadWorkOrderExtensionFile,
} from "../../../services/work-order-extensions";
import { todayISO } from "../../../lib/utils";

interface FormState {
  workOrderNumber: string;
  agreementNumber: string;
  agreementDate: string;
  tenderNumber: string;
  tenderAboveBelowPercent: number | "";
  contractValue: number;
  workOrderDate: string;
  completionDate: string;
  actualCompletionDate: string;
  securityDeposit: number;
  performanceGuarantee: number;
  emdValue: number;
  gstPercent: number | "";
  department: string;
  division: string;
  subDivision: string;
  clientEngineer: string;
  defectLiabilityPeriod: string;
}

function toFormState(site: Site): FormState {
  return {
    workOrderNumber: site.workOrderNumber,
    agreementNumber: site.agreementNumber,
    agreementDate: site.agreementDate,
    tenderNumber: site.tenderNumber,
    tenderAboveBelowPercent: site.tenderAboveBelowPercent === "" ? "" : Number(site.tenderAboveBelowPercent),
    contractValue: Number(site.contractValue),
    workOrderDate: site.workOrderDate,
    completionDate: site.completionDate,
    actualCompletionDate: site.actualCompletionDate,
    securityDeposit: Number(site.securityDeposit),
    performanceGuarantee: Number(site.performanceGuarantee),
    emdValue: Number(site.emdValue),
    gstPercent: site.gstPercent === "" ? "" : Number(site.gstPercent),
    department: site.department,
    division: site.division,
    subDivision: site.subDivision,
    clientEngineer: site.clientEngineer,
    defectLiabilityPeriod: site.defectLiabilityPeriod,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

export default function WorkOrderDetailsTab({ site, onSiteUpdated }: { site: Site; onSiteUpdated: (site: Site) => void }) {
  const [data, setData] = useState<FormState>(toFormState(site));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenderChangeReason, setTenderChangeReason] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<TenderPercentChangeLogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [showExtensions, setShowExtensions] = useState(false);
  const [extensions, setExtensions] = useState<WorkOrderExtension[]>([]);
  const [extensionsLoading, setExtensionsLoading] = useState(false);
  const [showAddExtension, setShowAddExtension] = useState(false);
  const [extForm, setExtForm] = useState({ extensionOrderNumber: "", extensionOrderDate: todayISO(), newCompletionDate: "", reason: "", remarks: "" });
  const [extFile, setExtFile] = useState<File | null>(null);
  const [extSaving, setExtSaving] = useState(false);
  const [extError, setExtError] = useState<string | null>(null);
  const [busyExtensionId, setBusyExtensionId] = useState<string | null>(null);

  const currentCompletionDate = extensions[0]?.newCompletionDate || site.completionDate;

  const savedTenderPercent = site.tenderAboveBelowPercent === "" ? "" : Number(site.tenderAboveBelowPercent);
  const tenderPercentIsChanged = editing && data.tenderAboveBelowPercent !== savedTenderPercent;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setData((d) => ({ ...d, [key]: value }));

  const loadHistory = () => {
    setHistoryLoading(true);
    getTenderPercentChangeLog(site.id)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  };

  const toggleHistory = () => {
    if (!showHistory && history.length === 0) loadHistory();
    setShowHistory((v) => !v);
  };

  const loadExtensions = () => {
    setExtensionsLoading(true);
    getWorkOrderExtensions(site.id)
      .then(setExtensions)
      .catch(() => setExtensions([]))
      .finally(() => setExtensionsLoading(false));
  };

  // Extensions are always loaded up front (not lazily on toggle) — the current effective
  // completion date shown next to the Work Order End Date field depends on this list.
  useEffect(() => {
    loadExtensions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site.id]);

  const toggleExtensions = () => setShowExtensions((v) => !v);

  const handleAddExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    setExtError(null);
    if (!extForm.extensionOrderNumber.trim()) return setExtError("Extension Order Number is required.");
    if (!extForm.extensionOrderDate) return setExtError("Extension Order Date is required.");
    if (!extForm.newCompletionDate) return setExtError("New Completion Date is required.");
    if (!extForm.reason.trim()) return setExtError("Reason is required.");
    setExtSaving(true);
    try {
      await createWorkOrderExtension(extFile, { siteId: site.id, ...extForm });
      setExtForm({ extensionOrderNumber: "", extensionOrderDate: todayISO(), newCompletionDate: "", reason: "", remarks: "" });
      setExtFile(null);
      setShowAddExtension(false);
      loadExtensions();
    } catch (err) {
      setExtError(err instanceof Error ? err.message : "Failed to record extension.");
    } finally {
      setExtSaving(false);
    }
  };

  const handlePreviewExtension = async (ext: WorkOrderExtension) => {
    setBusyExtensionId(ext.id);
    try {
      await previewWorkOrderExtensionFile(ext.id);
    } catch {
      alert("Failed to preview the letter.");
    } finally {
      setBusyExtensionId(null);
    }
  };

  const handleDownloadExtension = async (ext: WorkOrderExtension) => {
    setBusyExtensionId(ext.id);
    try {
      await downloadWorkOrderExtensionFile(ext.id, ext.letterFileName);
    } catch {
      alert("Failed to download the letter.");
    } finally {
      setBusyExtensionId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tenderPercentIsChanged && !tenderChangeReason.trim()) {
      setError("A reason is required when changing Tender Above/Below (%).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSite(site.id, { ...data, tenderChangeReason: tenderPercentIsChanged ? tenderChangeReason.trim() : undefined });
      onSiteUpdated(updated);
      setEditing(false);
      setTenderChangeReason("");
      if (showHistory) loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Work Order Details.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setData(toFormState(site));
    setTenderChangeReason("");
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Work Order Details</h2>
          <p className="text-sm text-slate-500">Every Site is self-contained — all contract and statutory details live here.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-slate-100 px-3 py-1.5 font-mono text-xs text-slate-600" title="System-generated, permanent, read-only">
            {site.siteCode || "Site Code pending"}
          </span>
          <button onClick={toggleHistory} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
            <History size={14} /> Tender % Change History
          </button>
          <button onClick={toggleExtensions} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
            <History size={14} /> Extension History
          </button>
          {!editing && (
            <button onClick={() => setEditing(true)} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
              Edit
            </button>
          )}
        </div>
      </div>

      {showHistory && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Previous %</th>
                <th className="px-4 py-3 text-left">New %</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-left">Changed By</th>
                <th className="px-4 py-3 text-left">Date &amp; Time</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No Tender % changes recorded yet.</td></tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="border-t">
                    <td className="px-4 py-3">{h.previousPercent || "0"}%</td>
                    <td className="px-4 py-3">{h.newPercent || "0"}%</td>
                    <td className="px-4 py-3">{h.reason}</td>
                    <td className="px-4 py-3">{h.changedByName || "—"}</td>
                    <td className="px-4 py-3">{new Date(h.changedAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showExtensions && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Work Order Extension History</h3>
              <p className="text-xs text-slate-500">
                Original Work Order End Date: <strong>{site.completionDate || "—"}</strong>
                {currentCompletionDate && currentCompletionDate !== site.completionDate && (
                  <> — Extension Till Date: <strong>{currentCompletionDate}</strong></>
                )}
              </p>
            </div>
            <button type="button" onClick={() => setShowAddExtension((v) => !v)} className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50">
              <Plus size={14} /> Add Extension
            </button>
          </div>

          {showAddExtension && (
            <form onSubmit={handleAddExtension} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              {extError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{extError}</div>}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field label="Extension Order Number *">
                  <input className={inputClass} value={extForm.extensionOrderNumber} onChange={(e) => setExtForm((f) => ({ ...f, extensionOrderNumber: e.target.value }))} />
                </Field>
                <Field label="Extension Order Date *">
                  <input type="date" className={inputClass} value={extForm.extensionOrderDate} onChange={(e) => setExtForm((f) => ({ ...f, extensionOrderDate: e.target.value }))} />
                </Field>
                <Field label="Previous Completion Date">
                  <input disabled className={`${inputClass} bg-slate-100`} value={currentCompletionDate || "—"} />
                </Field>
                <Field label="New Completion Date *">
                  <input type="date" className={inputClass} value={extForm.newCompletionDate} onChange={(e) => setExtForm((f) => ({ ...f, newCompletionDate: e.target.value }))} />
                </Field>
                <Field label="Extension Letter (PDF)">
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className={inputClass} onChange={(e) => setExtFile(e.target.files?.[0] ?? null)} />
                </Field>
                <Field label="Reason *">
                  <input className={inputClass} value={extForm.reason} onChange={(e) => setExtForm((f) => ({ ...f, reason: e.target.value }))} />
                </Field>
                <div className="md:col-span-3">
                  <Field label="Remarks">
                    <input className={inputClass} value={extForm.remarks} onChange={(e) => setExtForm((f) => ({ ...f, remarks: e.target.value }))} />
                  </Field>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddExtension(false)} className="rounded-lg border px-4 py-2 text-xs">Cancel</button>
                <button type="submit" disabled={extSaving} className="rounded-lg bg-blue-600 px-4 py-2 text-xs text-white hover:bg-blue-700 disabled:opacity-60">
                  {extSaving ? "Saving..." : "Save Extension"}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left">Order No.</th>
                  <th className="px-4 py-3 text-left">Order Date</th>
                  <th className="px-4 py-3 text-left">Previous Completion</th>
                  <th className="px-4 py-3 text-left">New Completion</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-left">Letter</th>
                  <th className="px-4 py-3 text-left">Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {extensionsLoading ? (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>
                ) : extensions.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">No extensions recorded yet.</td></tr>
                ) : (
                  extensions.map((ext) => (
                    <tr key={ext.id} className="border-t">
                      <td className="px-4 py-3">{ext.extensionOrderNumber}</td>
                      <td className="px-4 py-3">{ext.extensionOrderDate}</td>
                      <td className="px-4 py-3">{ext.previousCompletionDate}</td>
                      <td className="px-4 py-3 font-medium">{ext.newCompletionDate}</td>
                      <td className="px-4 py-3">{ext.reason}{ext.remarks && <span className="text-slate-400"> — {ext.remarks}</span>}</td>
                      <td className="px-4 py-3">
                        {ext.hasFile ? (
                          <div className="flex items-center gap-2">
                            <button type="button" disabled={busyExtensionId === ext.id} onClick={() => handlePreviewExtension(ext)} title="Preview" className="rounded p-1 text-blue-600 hover:bg-blue-50 disabled:opacity-50">
                              <Eye size={14} />
                            </button>
                            <button type="button" disabled={busyExtensionId === ext.id} onClick={() => handleDownloadExtension(ext)} title="Download" className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50">
                              <Download size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{ext.createdBy?.name ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSave} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Work Order & Agreement</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Work Order Number">
              <input disabled={!editing} className={inputClass} value={data.workOrderNumber} onChange={(e) => set("workOrderNumber", e.target.value)} />
            </Field>
            <Field label="Work Order Date">
              <input type="date" disabled={!editing} className={inputClass} value={data.workOrderDate} onChange={(e) => set("workOrderDate", e.target.value)} />
            </Field>
            <Field label="Work Order End Date">
              <input type="date" disabled={!editing} className={inputClass} value={data.completionDate} onChange={(e) => set("completionDate", e.target.value)} />
            </Field>
            <Field label="Agreement Number">
              <input disabled={!editing} className={inputClass} value={data.agreementNumber} onChange={(e) => set("agreementNumber", e.target.value)} />
            </Field>
            <Field label="Agreement Date">
              <input type="date" disabled={!editing} className={inputClass} value={data.agreementDate} onChange={(e) => set("agreementDate", e.target.value)} />
            </Field>
            <Field label="Tender Number">
              <input disabled={!editing} className={inputClass} value={data.tenderNumber} onChange={(e) => set("tenderNumber", e.target.value)} />
            </Field>
            <Field label="Tender Above / Below (%)">
              <input
                type="number"
                step="0.01"
                disabled={!editing}
                className={inputClass}
                value={data.tenderAboveBelowPercent}
                onChange={(e) => set("tenderAboveBelowPercent", e.target.value === "" ? "" : Number(e.target.value))}
              />
            </Field>
            {tenderPercentIsChanged && (
              <Field label="Reason for Change *">
                <input
                  className={inputClass}
                  value={tenderChangeReason}
                  onChange={(e) => setTenderChangeReason(e.target.value)}
                  placeholder="Required — this change is permanently logged"
                />
              </Field>
            )}
            {site.status === "COMPLETED" && (
              <Field label="Actual Completion Date">
                <input type="date" disabled={!editing} className={inputClass} value={data.actualCompletionDate} onChange={(e) => set("actualCompletionDate", e.target.value)} />
              </Field>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Value & Statutory</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Agreement Value">
              <input type="number" min="0" step="0.01" disabled={!editing} className={inputClass} value={data.contractValue} onChange={(e) => set("contractValue", Number(e.target.value))} />
            </Field>
            <Field label="EMD Value">
              <input type="number" min="0" step="0.01" disabled={!editing} className={inputClass} value={data.emdValue} onChange={(e) => set("emdValue", Number(e.target.value))} />
            </Field>
            <Field label="Security Deposit">
              <input type="number" min="0" step="0.01" disabled={!editing} className={inputClass} value={data.securityDeposit} onChange={(e) => set("securityDeposit", Number(e.target.value))} />
            </Field>
            <Field label="Performance Guarantee">
              <input type="number" min="0" step="0.01" disabled={!editing} className={inputClass} value={data.performanceGuarantee} onChange={(e) => set("performanceGuarantee", Number(e.target.value))} />
            </Field>
            <Field label="GST (%)">
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={!editing}
                className={inputClass}
                value={data.gstPercent}
                onChange={(e) => set("gstPercent", e.target.value === "" ? "" : Number(e.target.value))}
              />
            </Field>
            <Field label="Defect Liability Period">
              <input disabled={!editing} className={inputClass} value={data.defectLiabilityPeriod} onChange={(e) => set("defectLiabilityPeriod", e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Department</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Department">
              <input disabled={!editing} className={inputClass} value={data.department} onChange={(e) => set("department", e.target.value)} />
            </Field>
            <Field label="Division">
              <input disabled={!editing} className={inputClass} value={data.division} onChange={(e) => set("division", e.target.value)} />
            </Field>
            <Field label="Sub Division">
              <input disabled={!editing} className={inputClass} value={data.subDivision} onChange={(e) => set("subDivision", e.target.value)} />
            </Field>
            <Field label="Client Engineer">
              <input disabled={!editing} className={inputClass} value={data.clientEngineer} onChange={(e) => set("clientEngineer", e.target.value)} />
            </Field>
          </div>
        </div>

        {editing && (
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button type="button" onClick={handleCancel} className="rounded-lg border px-5 py-2.5 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </form>

      <p className="text-xs text-slate-400">
        Contract Documents for this Site are managed in the Documents tab.
      </p>
    </div>
  );
}
