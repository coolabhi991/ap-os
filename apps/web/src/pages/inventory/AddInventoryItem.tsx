import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import InventoryForm from "../../components/inventory/InventoryForm";
import type { InventoryFormData } from "../../services/inventory";

import { createInventoryItem } from "../../services/inventory";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";

export default function AddInventoryItem() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getVendors({ limit: 100 }).then((r) => setSuppliers(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (data: InventoryFormData) => {
    try {
      setSaving(true);
      setError(null);
      await createInventoryItem(data);
      navigate("/inventory");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create inventory item. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Add Inventory Item</h1>
          <p className="mt-2 text-slate-500">Register a new stock item.</p>
        </div>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>
        )}
        <InventoryForm onSubmit={handleSubmit} saving={saving} projects={projects} suppliers={suppliers} />
      </div>
    </Layout>
  );
}
