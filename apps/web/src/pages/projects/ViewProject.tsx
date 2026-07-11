import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, MapPin } from "lucide-react";
import Layout from "../../components/layout/Layout";
import ContractInformationTab from "../../components/projects/ContractInformationTab";
import { getProject } from "../../services/projects";
import type { Project } from "../../services/projects";
import { getSites } from "../../services/sites";
import type { Site } from "../../services/sites";
import { SITE_TYPE_LABELS, SITE_STATUS_LABELS, SITE_STATUS_COLORS } from "../../services/sites";

const TABS = [
  { key: "sites", label: "Sites" },
  { key: "contract-information", label: "Contract Information" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function ViewProject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("sites");

  useEffect(() => {
    if (!id) return;
    getProject(id)
      .then(setProject)
      .catch(() => setError("Project not found or failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setSitesLoading(true);
    getSites(id)
      .then(setSites)
      .catch(() => {})
      .finally(() => setSitesLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading project...</div>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Project Not Found</h1>
          <p className="mt-2 text-slate-500">{error ?? "This project does not exist."}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="font-mono text-sm text-blue-600">{project.code || project.id}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{project.name}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
            {project.client && <span>Client: <strong>{project.client.name}</strong></span>}
            {project.location && <span>Location: <strong>{project.location}</strong></span>}
            {project.manager && <span>Manager: <strong>{project.manager}</strong></span>}
          </div>
        </div>

        <div className="flex gap-2 rounded-xl bg-white p-2 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t.key ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "sites" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Sites</h2>
                <p className="mt-1 text-sm text-slate-500">All operational work happens inside a Site Workspace.</p>
              </div>
              <button
                onClick={() => navigate(`/projects/${id}/sites/new`)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
              >
                <Plus size={18} />
                New Site
              </button>
            </div>

            {sitesLoading && (
              <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">Loading sites...</div>
            )}

            {!sitesLoading && sites.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500 shadow-sm">
                No sites yet. Create the first site to start operational work.
              </div>
            )}

            {!sitesLoading && sites.length > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => navigate(`/sites/${site.id}`)}
                    className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">{site.name}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${SITE_STATUS_COLORS[site.status]}`}>
                        {SITE_STATUS_LABELS[site.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-blue-600">{SITE_TYPE_LABELS[site.siteType]}</p>
                    {(site.village || site.taluka || site.district) && (
                      <p className="mt-2 flex items-center gap-1 text-sm text-slate-500">
                        <MapPin size={14} />
                        {[site.village, site.taluka, site.district].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {site.engineer && <p className="mt-1 text-sm text-slate-500">Engineer: {site.engineer}</p>}
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      Contract Value: ₹{Number(site.contractValue).toLocaleString("en-IN")}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "contract-information" && <ContractInformationTab project={project} />}
      </div>
    </Layout>
  );
}
