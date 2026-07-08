import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import PurchaseOrderForm from "../../components/purchase-orders/PurchaseOrderForm";
import { createPurchaseOrder, getApprovedPRsForPO } from "../../services/purchase-orders";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";
import type { POFormData, ApprovedPR } from "../../services/purchase-orders";

export default function AddPurchaseOrder() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvedPRs, setApprovedPRs] = useState<ApprovedPR[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getApprovedPRsForPO().then(setApprovedPRs).catch(() => {});
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getVendors({ limit: 100 }).then((r) => setVendors(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (data: POFormData) => {
    try {
      setSaving(true);
      setError(null);
      await createPurchaseOrder(data);
      navigate("/purchase-orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create purchase order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">New Purchase Order</h1>
          <p className="mt-2 text-slate-500">Convert an approved purchase requisition into a purchase order.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        <PurchaseOrderForm
          onSubmit={handleSubmit}
          saving={saving}
          approvedPRs={approvedPRs}
          projects={projects}
          vendors={vendors}
        />
      </div>
    </Layout>
  );
}
