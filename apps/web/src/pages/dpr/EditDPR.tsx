import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import DPRForm from "../../components/dpr/DPRForm";
import { getDPR, updateDPR } from "../../services/dpr";
import type { DPRDetail, DPRFormData } from "../../services/dpr";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";
import { getUsers } from "../../services/users";

export default function EditDPR() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dpr, setDpr] = useState<DPRDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [contractors, setContractors] = useState<{ id: string; name: string }[]>([]);
  const [engineers, setEngineers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getVendors({ limit: 100 }).then((r) => setContractors(r.data)).catch(() => {});
    getUsers().then((users) => setEngineers(users.filter((u) => u.active))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    getDPR(id)
      .then(setDpr)
      .catch(() => setError("DPR not found."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: DPRFormData) => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      await updateDPR(id, data);
      navigate(`/dpr/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update DPR.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div></Layout>;
  if (error && !dpr) return <Layout><div className="rounded-xl bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold">DPR Not Found</h1><p className="mt-2 text-slate-500">{error}</p></div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit DPR — {dpr?.dprNumber}</h1>
          <p className="mt-2 text-slate-500">Update the daily site diary entry.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        {dpr && (
          <DPRForm
            initialData={dpr}
            onSubmit={handleSubmit}
            saving={saving}
            projects={projects}
            contractors={contractors}
            engineers={engineers}
          />
        )}
      </div>
    </Layout>
  );
}
