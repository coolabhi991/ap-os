import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import MaterialReceiptForm from "../../components/material-receipts/MaterialReceiptForm";
import {
  getMaterialReceipt,
  updateMaterialReceipt,
} from "../../services/material-receipts";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";
import type { MRFormData, ReceivablePO } from "../../services/material-receipts";

export default function EditMaterialReceipt() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<Partial<MRFormData> | undefined>();
  const [receivablePOs, setReceivablePOs] = useState<ReceivablePO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getVendors({ limit: 100 }).then((r) => setVendors(r.data)).catch(() => {});

    if (!id) return;
    getMaterialReceipt(id)
      .then((mr) => {
        setInitialData({
          purchaseOrderId: mr.purchaseOrderId,
          projectId: mr.projectId,
          vendorId: mr.vendorId,
          receivedDate: mr.receivedDate,
          challanNumber: mr.challanNumber,
          supplierInvoiceNumber: mr.supplierInvoiceNumber,
          vehicleNumber: mr.vehicleNumber,
          receivedBy: mr.receivedBy,
          supplierRepresentative: mr.supplierRepresentative,
          qualityStatus: mr.qualityStatus,
          items: mr.items,
          status: mr.status,
          remarks: mr.remarks,
          notes: mr.notes,
        });

        // Locked select just needs this one PO to render its label.
        if (mr.purchaseOrder) {
          setReceivablePOs([
            {
              id: mr.purchaseOrder.id,
              poNumber: mr.purchaseOrder.poNumber,
              projectId: mr.projectId,
              vendorId: mr.vendorId,
              items: [],
              receivedByIndex: {},
            },
          ]);
        }
      })
      .catch(() => setError("Failed to load material receipt."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: MRFormData) => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      await updateMaterialReceipt(id, data);
      navigate("/material-receipts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update material receipt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Material Receipt</h1>
          <p className="mt-2 text-slate-500">Update receipt details and quality inspection results.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div>
        ) : (
          <MaterialReceiptForm
            initialData={initialData}
            onSubmit={handleSubmit}
            saving={saving}
            receivablePOs={receivablePOs}
            projects={projects}
            vendors={vendors}
            poLocked
          />
        )}
      </div>
    </Layout>
  );
}
