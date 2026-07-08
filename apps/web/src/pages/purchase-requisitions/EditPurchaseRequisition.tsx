import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import PurchaseRequisitionForm from "../../components/purchase-requisitions/PurchaseRequisitionForm";
import {
  getPurchaseRequisition,
  updatePurchaseRequisition,
} from "../../services/purchase-requisitions";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";
import type { PRFormData } from "../../services/purchase-requisitions";

export default function EditPurchaseRequisition() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<Partial<PRFormData> | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getVendors({ limit: 100 }).then((r) => setVendors(r.data)).catch(() => {});

    if (!id) return;
    getPurchaseRequisition(id)
      .then((pr) => {
        setInitialData({
          requisitionNumber: pr.requisitionNumber,
          title: pr.title,
          description: pr.description,
          projectId: pr.projectId,
          vendorId: pr.vendorId,
          requiredDate: pr.requiredDate,
          status: pr.status,
          items: pr.items,
          notes: pr.notes,
        });
      })
      .catch(() => setError("Failed to load requisition."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: PRFormData) => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      await updatePurchaseRequisition(id, data);
      navigate("/purchase-requisitions");
    } catch {
      setError("Failed to update requisition.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Purchase Requisition</h1>
          <p className="mt-2 text-slate-500">Update requisition details and items.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div>
        ) : (
          <PurchaseRequisitionForm
            initialData={initialData}
            onSubmit={handleSubmit}
            saving={saving}
            projects={projects}
            vendors={vendors}
          />
        )}
      </div>
    </Layout>
  );
}
