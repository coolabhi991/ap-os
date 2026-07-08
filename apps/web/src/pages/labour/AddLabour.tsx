import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import LabourForm from "../../components/labour/LabourForm";
import { createLabour } from "../../services/labour";
import type { LabourFormData } from "../../services/labour";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";
import { getLabourGroups } from "../../services/labour-groups";

export default function AddLabour() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [contractors, setContractors] = useState<{ id: string; name: string }[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getVendors({ limit: 100, category: "Labour" }).then((r) => setContractors(r.data)).catch(() => {});
    getLabourGroups(false).then(setGroups).catch(() => {});
  }, []);

  const handleSubmit = async (data: LabourFormData) => {
    try {
      setSaving(true);
      setError(null);
      await createLabour(data);
      navigate("/labour");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create labour record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">New Worker</h1>
          <p className="mt-2 text-slate-500">Add a worker to the labour master.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        <LabourForm mode="create" onSubmit={handleSubmit} saving={saving} projects={projects} contractors={contractors} groups={groups} />
      </div>
    </Layout>
  );
}
