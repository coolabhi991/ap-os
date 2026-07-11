import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import DPRForm from "../../components/dpr/DPRForm";
import { createDPR } from "../../services/dpr";
import type { DPRFormData } from "../../services/dpr";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";
import { getUsers } from "../../services/users";

export default function AddDPR() {
  const navigate = useNavigate();
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

  const handleSubmit = async (data: DPRFormData) => {
    try {
      setSaving(true);
      setError(null);
      const dpr = await createDPR(data);
      navigate(`/dpr/${dpr.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create DPR.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">New Daily Progress Report</h1>
          <p className="mt-2 text-slate-500">Official daily site diary — labour, machinery, and material figures are pulled automatically.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        <DPRForm onSubmit={handleSubmit} saving={saving} projects={projects} contractors={contractors} engineers={engineers} />
      </div>
    </Layout>
  );
}
