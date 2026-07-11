import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import MBForm from "../../components/measurement-books/MBForm";
import { createMB } from "../../services/measurement-books";
import type { MBFormData } from "../../services/measurement-books";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";
import { getUsers } from "../../services/users";

export default function AddMB() {
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

  const handleSubmit = async (data: MBFormData) => {
    try {
      setSaving(true);
      setError(null);
      const mb = await createMB(data);
      navigate(`/measurement-books/${mb.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create Measurement Book.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">New Measurement Book</h1>
          <p className="mt-2 text-slate-500">Record BOQ measurements and generate the abstract sheet automatically.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        <MBForm onSubmit={handleSubmit} saving={saving} projects={projects} contractors={contractors} engineers={engineers} />
      </div>
    </Layout>
  );
}
