import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import RunningBillForm from "../../components/running-bills/RunningBillForm";
import type { AbstractPreviewRow } from "../../components/running-bills/RunningBillForm";
import { createRunningBill, getBillableMBs } from "../../services/running-bills";
import type { BillableMB, RunningBillFormData } from "../../services/running-bills";
import { getMB } from "../../services/measurement-books";
import type { MB } from "../../services/measurement-books";
import { getProjects } from "../../services/projects";
import LoadingState from "../../components/ui/LoadingState";

export default function AddRunningBill() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [billableMBs, setBillableMBs] = useState<BillableMB[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [selectedMB, setSelectedMB] = useState<MB | null>(null);
  const [loadingMB, setLoadingMB] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingList(true);
    getBillableMBs(projectFilter || undefined)
      .then(setBillableMBs)
      .catch(() => setError("Failed to load billable Measurement Books."))
      .finally(() => setLoadingList(false));
  }, [projectFilter]);

  const handleSelectMB = async (mbId: string) => {
    setLoadingMB(true);
    setError(null);
    try {
      const mb = await getMB(mbId);
      setSelectedMB(mb);
    } catch {
      setError("Failed to load Measurement Book details.");
    } finally {
      setLoadingMB(false);
    }
  };

  const handleSubmit = async (data: RunningBillFormData) => {
    if (!selectedMB) return;
    try {
      setSaving(true);
      setError(null);
      const bill = await createRunningBill({ ...data, measurementBookId: selectedMB.id });
      navigate(`/running-bills/${bill.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create Running Bill.");
    } finally {
      setSaving(false);
    }
  };

  if (!selectedMB) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">New Running Bill</h1>
            <p className="mt-2 text-slate-500">Select the Approved Measurement Book to bill. Each Approved MB can be linked to only one Running Bill.</p>
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="rounded-lg border p-2.5">
              <option value="">All Projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {loadingList ? (
            <LoadingState />
          ) : billableMBs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">
              No unbilled Approved Measurement Books found. Approve a Measurement Book first.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left">MB #</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Project</th>
                    <th className="px-4 py-3 text-left">Sub Work</th>
                    <th className="px-4 py-3 text-right">BOQ Rows</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {billableMBs.map((mb) => (
                    <tr key={mb.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{mb.mbNumber}</td>
                      <td className="px-4 py-3">{mb.mbDate}</td>
                      <td className="px-4 py-3">{mb.project?.name ?? "—"}</td>
                      <td className="px-4 py-3">{mb.subWork?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-right">{mb.itemCount}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleSelectMB(mb.id)}
                          disabled={loadingMB}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {loadingMB ? "Loading..." : "Use This MB"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  const abstractRows: AbstractPreviewRow[] = selectedMB.items.map((i) => ({
    boqItemNo: i.boqItemNo,
    boqDescription: i.boqDescription,
    unit: i.unit,
    currentQuantity: i.quantity,
    boqRate: i.boqRate,
    paymentPercent: i.paymentPercent,
    effectiveRate: i.effectiveRate,
    currentAmount: i.amount,
  }));

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">New Running Bill</h1>
            <p className="mt-2 text-slate-500">Building against MB {selectedMB.mbNumber}.</p>
          </div>
          <button onClick={() => setSelectedMB(null)} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Choose a different MB</button>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        <RunningBillForm
          source={{ mbNumber: selectedMB.mbNumber, mbDate: selectedMB.mbDate, project: selectedMB.project?.name ?? "", subWork: selectedMB.subWork?.name ?? "", site: selectedMB.site }}
          items={abstractRows}
          onSubmit={handleSubmit}
          saving={saving}
        />
      </div>
    </Layout>
  );
}
