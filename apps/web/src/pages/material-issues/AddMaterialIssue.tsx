import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import MaterialIssueForm from "../../components/material-issues/MaterialIssueForm";
import { createMaterialIssue } from "../../services/material-issues";
import type { MaterialIssueFormData } from "../../services/material-issues";
import { getProjects } from "../../services/projects";
import { getInventoryItems } from "../../services/inventory";
import type { InventoryItem } from "../../services/inventory";

export default function AddMaterialIssue() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [materials, setMaterials] = useState<InventoryItem[]>([]);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getInventoryItems({ limit: 200 }).then((r) => setMaterials(r.data.filter((m) => Number(m.availableStock) > 0))).catch(() => {});
  }, []);

  const handleSubmit = async (data: MaterialIssueFormData) => {
    try {
      setSaving(true);
      setError(null);
      await createMaterialIssue(data);
      navigate("/material-issues");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create material issue.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">New Material Issue</h1>
          <p className="mt-2 text-slate-500">Issue materials from inventory to a project.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        <MaterialIssueForm mode="create" onSubmit={handleSubmit} saving={saving} projects={projects} materials={materials} />
      </div>
    </Layout>
  );
}
