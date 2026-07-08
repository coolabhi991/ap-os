import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import VendorForm from "../../components/vendors/VendorForm";
import type { VendorFormData } from "../../services/vendors";

import { createVendor } from "../../services/vendors";

export default function AddVendor() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: VendorFormData) => {
    try {
      setSaving(true);
      setError(null);
      await createVendor(data);
      navigate("/vendors");
    } catch {
      setError("Failed to create vendor. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Add Vendor</h1>
          <p className="mt-2 text-slate-500">Register a new vendor or supplier.</p>
        </div>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>
        )}
        <VendorForm onSubmit={handleSubmit} saving={saving} />
      </div>
    </Layout>
  );
}
