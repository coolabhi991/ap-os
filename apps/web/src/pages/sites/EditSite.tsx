import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import SiteForm from "../../components/sites/SiteForm";
import type { Site, SiteFormData } from "../../services/sites";
import { getSite, updateSite } from "../../services/sites";

export default function EditSite() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getSite(id)
      .then(setSite)
      .catch(() => setError("Site not found or failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: SiteFormData) => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      await updateSite(id, data);
      navigate(`/sites/${id}`);
    } catch {
      setError("Failed to update site. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading site...</div>
      </Layout>
    );
  }

  if (error && !site) {
    return (
      <Layout>
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Site</h1>
          <p className="mt-2 text-slate-500">Update site details.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        {site && (
          <SiteForm
            initialData={{
              projectId: site.projectId,
              name: site.name,
              village: site.village,
              taluka: site.taluka,
              district: site.district,
              engineer: site.engineer,
              siteType: site.siteType,
              status: site.status,
              contractValue: Number(site.contractValue),
              emdValue: Number(site.emdValue),
              securityDeposit: Number(site.securityDeposit),
              performanceGuarantee: Number(site.performanceGuarantee),
              workOrderDate: site.workOrderDate,
              completionDate: site.completionDate,
            }}
            onSubmit={handleSubmit}
            saving={saving}
          />
        )}
      </div>
    </Layout>
  );
}
