import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import PurchaseOrderForm from "../../components/purchase-orders/PurchaseOrderForm";
import { getPurchaseOrder, updatePurchaseOrder, getApprovedPRsForPO } from "../../services/purchase-orders";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";
import type { POFormData, ApprovedPR } from "../../services/purchase-orders";

export default function EditPurchaseOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<Partial<POFormData> | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvedPRs, setApprovedPRs] = useState<ApprovedPR[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getApprovedPRsForPO().then(setApprovedPRs).catch(() => {});
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getVendors({ limit: 100 }).then((r) => setVendors(r.data)).catch(() => {});

    if (!id) return;
    getPurchaseOrder(id)
      .then((po) => {
        setInitialData({
          poNumber: po.poNumber,
          requisitionId: po.requisitionId,
          projectId: po.projectId,
          vendorId: po.vendorId,
          orderDate: po.orderDate,
          expectedDate: po.expectedDate,
          deliveryAddress: po.deliveryAddress,
          paymentTerms: po.paymentTerms,
          items: po.items,
          notes: po.notes,
          status: po.status,
        });
      })
      .catch(() => setError("Failed to load purchase order."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: POFormData) => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      await updatePurchaseOrder(id, data);
      navigate("/purchase-orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update purchase order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Purchase Order</h1>
          <p className="mt-2 text-slate-500">Update purchase order details and items.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div>
        ) : (
          <PurchaseOrderForm
            initialData={initialData}
            onSubmit={handleSubmit}
            saving={saving}
            approvedPRs={approvedPRs}
            projects={projects}
            vendors={vendors}
          />
        )}
      </div>
    </Layout>
  );
}
