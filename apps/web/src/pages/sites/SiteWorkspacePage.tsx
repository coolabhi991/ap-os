import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import Layout from "../../components/layout/Layout";
import SiteWorkspace from "../../components/site-workspace/SiteWorkspace";
import { getSite } from "../../services/sites";
import type { Site } from "../../services/sites";
import { SITE_TYPE_LABELS, SITE_STATUS_LABELS, SITE_STATUS_COLORS } from "../../services/sites";

export default function SiteWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getSite(id)
      .then(setSite)
      .catch(() => setError("Site not found or failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading site workspace...</div>
      </Layout>
    );
  }

  if (error || !site) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Site Not Found</h1>
          <p className="mt-2 text-slate-500">{error ?? "This site does not exist."}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <button onClick={() => navigate(`/projects/${site.projectId}`)} className="mb-3 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft size={14} /> Back to Project
          </button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{site.name}</h1>
                {site.siteCode && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">{site.siteCode}</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                <span>{SITE_TYPE_LABELS[site.siteType]}</span>
                {(site.village || site.taluka || site.district) && (
                  <span>{[site.village, site.taluka, site.district].filter(Boolean).join(", ")}</span>
                )}
                {site.engineer && <span>Engineer: <strong>{site.engineer}</strong></span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-4 py-2 text-sm font-medium ${SITE_STATUS_COLORS[site.status]}`}>{SITE_STATUS_LABELS[site.status]}</span>
              <button onClick={() => navigate(`/sites/${site.id}/edit`)} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
                <Pencil size={14} /> Edit Site
              </button>
            </div>
          </div>
        </div>

        <SiteWorkspace site={site} onSiteUpdated={setSite} />
      </div>
    </Layout>
  );
}
