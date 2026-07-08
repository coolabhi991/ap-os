import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import LabourForm from "../../components/labour/LabourForm";
import { getLabour, updateLabour } from "../../services/labour";
import type { LabourFormData } from "../../services/labour";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";
import { getLabourGroups } from "../../services/labour-groups";

export default function EditLabour() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<Partial<LabourFormData> | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [contractors, setContractors] = useState<{ id: string; name: string }[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getVendors({ limit: 100, category: "Labour" }).then((r) => setContractors(r.data)).catch(() => {});
    getLabourGroups(false).then(setGroups).catch(() => {});

    if (!id) return;
    getLabour(id)
      .then((l) => {
        setInitialData({
          name: l.name,
          projectId: l.projectId,
          contractorId: l.contractorId,
          groupId: l.groupId,
          phone: l.phone,
          designation: l.designation,
          category: l.category,
          status: l.status,
          remarks: l.remarks,
        });
      })
      .catch(() => setError("Failed to load labour record."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: LabourFormData) => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      await updateLabour(id, data);
      navigate("/labour");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update labour record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Worker</h1>
          <p className="mt-2 text-slate-500">Update worker details. Wage rate is managed from the worker's detail page.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div>
        ) : (
          <LabourForm mode="edit" initialData={initialData} onSubmit={handleSubmit} saving={saving} projects={projects} contractors={contractors} groups={groups} />
        )}
      </div>
    </Layout>
  );
}
