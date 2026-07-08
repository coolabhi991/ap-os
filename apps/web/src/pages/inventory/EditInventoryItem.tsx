import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import InventoryForm from "../../components/inventory/InventoryForm";
import type { InventoryFormData } from "../../services/inventory";

import { getInventoryItem, updateInventoryItem } from "../../services/inventory";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";

export default function EditInventoryItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<Partial<InventoryFormData> | undefined>();
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getVendors({ limit: 100 }).then((r) => setSuppliers(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    getInventoryItem(id)
      .then((item) => {
        setInitialData({
          itemCode: item.itemCode,
          itemName: item.itemName,
          category: item.category,
          unit: item.unit,
          projectId: item.projectId,
          openingBalance: Number(item.openingBalance),
          reservedStock: Number(item.reservedStock),
          reorderLevel: Number(item.reorderLevel),
          minStock: Number(item.minStock),
          maxStock: Number(item.maxStock),
          warehouse: item.warehouse,
          rackLocation: item.rackLocation,
          batchNumber: item.batchNumber,
          supplierId: item.supplierId,
          location: item.location,
        });
      })
      .catch(() => setError("Failed to load inventory item."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: InventoryFormData) => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      await updateInventoryItem(id, data);
      navigate("/inventory");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update inventory item. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Inventory Item</h1>
          <p className="mt-2 text-slate-500">Update stock item information.</p>
        </div>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>
        )}
        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading inventory item...</div>
        ) : (
          <InventoryForm
            initialData={initialData}
            onSubmit={handleSubmit}
            saving={saving}
            projects={projects}
            suppliers={suppliers}
            isEdit
          />
        )}
      </div>
    </Layout>
  );
}
