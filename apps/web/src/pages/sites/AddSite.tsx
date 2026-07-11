import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import SiteForm from "../../components/sites/SiteForm";
import type { SiteFormData } from "../../services/sites";
import { createSite } from "../../services/sites";

export default function AddSite() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: SiteFormData) => {
    if (!projectId) return;
    try {
      setSaving(true);
      setError(null);
      await createSite({ ...data, projectId });
      navigate(`/projects/${projectId}`);
    } catch {
      setError("Failed to create site. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Add Site</h1>
          <p className="mt-2 text-slate-500">Create a new site under this project.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        <SiteForm onSubmit={handleSubmit} saving={saving} />
      </div>
    </Layout>
  );
}
