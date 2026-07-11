import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import MBForm from "../../components/measurement-books/MBForm";
import { getMB, updateMB } from "../../services/measurement-books";
import type { MB, MBFormData } from "../../services/measurement-books";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";
import { getUsers } from "../../services/users";

export default function EditMB() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mb, setMb] = useState<MB | null>(null);
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
    getMB(id)
      .then(setMb)
      .catch(() => setError("Measurement Book not found."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: MBFormData) => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      await updateMB(id, data);
      navigate(`/measurement-books/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update Measurement Book.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div></Layout>;
  if (error && !mb) return <Layout><div className="rounded-xl bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold">Measurement Book Not Found</h1><p className="mt-2 text-slate-500">{error}</p></div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit MB — {mb?.mbNumber}</h1>
          <p className="mt-2 text-slate-500">Update measurements and the abstract sheet.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        {mb && (
          <MBForm
            initialData={mb}
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
