import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import RunningBillForm from "../../components/running-bills/RunningBillForm";
import type { AbstractPreviewRow } from "../../components/running-bills/RunningBillForm";
import { getRunningBill, updateRunningBill } from "../../services/running-bills";
import type { RunningBill, RunningBillFormData } from "../../services/running-bills";

export default function EditRunningBill() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bill, setBill] = useState<RunningBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getRunningBill(id)
      .then(setBill)
      .catch(() => setError("Running Bill not found."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: RunningBillFormData) => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      await updateRunningBill(id, data);
      navigate(`/running-bills/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update Running Bill.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div></Layout>;
  if (error && !bill) return <Layout><div className="rounded-xl bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold">Running Bill Not Found</h1><p className="mt-2 text-slate-500">{error}</p></div></Layout>;

  if (!bill) return null;

  const abstractRows: AbstractPreviewRow[] = bill.items.map((i) => ({
    boqItemNo: i.boqItemNo,
    boqDescription: i.boqDescription,
    unit: i.unit,
    previousQuantity: i.previousQuantity,
    currentQuantity: i.currentQuantity,
    totalQuantity: i.totalQuantity,
    boqRate: i.boqRate,
    paymentPercent: i.paymentPercent,
    effectiveRate: i.effectiveRate,
    previousAmount: i.previousAmount,
    currentAmount: i.currentAmount,
    totalAmount: i.totalAmount,
  }));

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Running Bill — {bill.billNumber}</h1>
          <p className="mt-2 text-slate-500">
            {bill.measurementBookId
              ? "Update header details and deductions. The Abstract is always re-imported from the linked Measurement Book."
              : "Update header details and deductions. To correct a quantity mistake, delete this Draft RA Bill and create it again."}
          </p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        <RunningBillForm
          initialData={bill}
          source={{
            mbNumber: bill.measurementBook?.mbNumber ?? "",
            mbDate: bill.measurementBook?.mbDate ?? "",
            project: bill.project?.name ?? "",
            subWork: bill.subWork?.name ?? "",
            site: bill.siteRecord?.name ?? "",
          }}
          items={abstractRows}
          onSubmit={handleSubmit}
          saving={saving}
        />
      </div>
    </Layout>
  );
}
