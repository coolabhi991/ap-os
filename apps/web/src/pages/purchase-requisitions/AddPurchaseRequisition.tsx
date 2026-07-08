import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import PurchaseRequisitionForm from "../../components/purchase-requisitions/PurchaseRequisitionForm";
import { createPurchaseRequisition } from "../../services/purchase-requisitions";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";
import type { PRFormData } from "../../services/purchase-requisitions";

export default function AddPurchaseRequisition() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getVendors({ limit: 100 }).then((r) => setVendors(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (data: PRFormData) => {
    try {
      setSaving(true);
      setError(null);
      await createPurchaseRequisition(data);
      navigate("/purchase-requisitions");
    } catch {
      setError("Failed to create requisition.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">New Purchase Requisition</h1>
          <p className="mt-2 text-slate-500">Create a material purchase request.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        <PurchaseRequisitionForm
          onSubmit={handleSubmit}
          saving={saving}
          projects={projects}
          vendors={vendors}
        />
      </div>
    </Layout>
  );
}
