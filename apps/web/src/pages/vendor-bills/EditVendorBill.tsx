import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import VendorBillForm from "../../components/vendor-bills/VendorBillForm";
import type { VendorBillFormData } from "../../services/vendor-bills";

import { getVendorBill, updateVendorBill } from "../../services/vendor-bills";
import { getVendors } from "../../services/vendors";
import { getProjects } from "../../services/projects";
import { getPurchaseOrders } from "../../services/purchase-orders";

export default function EditVendorBill() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<Partial<VendorBillFormData> | undefined>();
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<{ id: string; poNumber: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVendors({ limit: 100 }).then((r) => setVendors(r.data)).catch(() => {});
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getPurchaseOrders({ limit: 100 }).then((r) => setPurchaseOrders(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    getVendorBill(id)
      .then((bill) => {
        setInitialData({
          vendorId: bill.vendorId,
          projectId: bill.projectId,
          siteId: bill.siteId,
          purchaseOrderId: bill.purchaseOrderId,
          billNumber: bill.billNumber,
          billDate: bill.billDate,
          dueDate: bill.dueDate,
          billAmount: Number(bill.billAmount),
          taxableAmount: Number(bill.taxableAmount),
          gstAmount: Number(bill.gstAmount),
          totalAmount: Number(bill.totalAmount),
          invoiceFileName: bill.invoiceFileName,
          invoiceFileUrl: bill.invoiceFileUrl,
          notes: bill.notes,
        });
      })
      .catch(() => setError("Failed to load vendor bill."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: VendorBillFormData) => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      await updateVendorBill(id, data);
      navigate("/vendor-bills");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update vendor bill. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Vendor Bill</h1>
          <p className="mt-2 text-slate-500">Update vendor bill information.</p>
        </div>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>
        )}
        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading vendor bill...</div>
        ) : (
          <VendorBillForm
            initialData={initialData}
            onSubmit={handleSubmit}
            saving={saving}
            vendors={vendors}
            projects={projects}
            purchaseOrders={purchaseOrders}
            isEdit
          />
        )}
      </div>
    </Layout>
  );
}
