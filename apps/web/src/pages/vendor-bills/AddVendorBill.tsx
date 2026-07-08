import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import VendorBillForm from "../../components/vendor-bills/VendorBillForm";
import type { VendorBillFormData } from "../../services/vendor-bills";

import { createVendorBill } from "../../services/vendor-bills";
import { getVendors } from "../../services/vendors";
import { getProjects } from "../../services/projects";
import { getPurchaseOrders } from "../../services/purchase-orders";
import { getMaterialReceipts } from "../../services/material-receipts";

export default function AddVendorBill() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<{ id: string; poNumber: string }[]>([]);
  const [materialReceipts, setMaterialReceipts] = useState<{ id: string; receiptNumber: string }[]>([]);

  useEffect(() => {
    getVendors({ limit: 100 }).then((r) => setVendors(r.data)).catch(() => {});
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getPurchaseOrders({ limit: 100 }).then((r) => setPurchaseOrders(r.data)).catch(() => {});
    getMaterialReceipts({ limit: 100 }).then((r) => setMaterialReceipts(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (data: VendorBillFormData) => {
    try {
      setSaving(true);
      setError(null);
      await createVendorBill(data);
      navigate("/vendor-bills");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vendor bill. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">New Vendor Bill</h1>
          <p className="mt-2 text-slate-500">Record a vendor invoice for materials delivered on site.</p>
        </div>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>
        )}
        <VendorBillForm
          onSubmit={handleSubmit}
          saving={saving}
          vendors={vendors}
          projects={projects}
          purchaseOrders={purchaseOrders}
          materialReceipts={materialReceipts}
        />
      </div>
    </Layout>
  );
}
