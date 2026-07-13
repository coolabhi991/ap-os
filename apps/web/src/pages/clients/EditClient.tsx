import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import ClientForm from "../../components/clients/ClientForm";
import type { ClientFormData } from "../../services/clients";

import { getClient, updateClient } from "../../services/clients";

export default function EditClient() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<Partial<ClientFormData> | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getClient(id)
      .then((client) => {
        setInitialData({
          companyName: client.companyName,
          contactPerson: client.contactPerson,
          mobile: client.mobile,
          email: client.email,
          gst: client.gst,
          pan: client.pan,
          address: client.address,
          city: client.city,
          state: client.state,
          pincode: client.pincode,
          website: client.website,
          status: client.status,
          notes: client.notes,
        });
      })
      .catch(() => setError("Failed to load client."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: ClientFormData) => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      await updateClient(id, data);
      navigate("/clients");
    } catch {
      setError("Failed to update client. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Client</h1>
          <p className="mt-2 text-slate-500">Update client information.</p>
        </div>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>
        )}
        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading client...</div>
        ) : (
          <ClientForm initialData={initialData} onSubmit={handleSubmit} saving={saving} />
        )}
      </div>
    </Layout>
  );
}
