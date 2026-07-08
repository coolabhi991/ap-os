import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import VendorForm from "../../components/vendors/VendorForm";
import type { VendorFormData } from "../../services/vendors";

import { getVendor, updateVendor } from "../../services/vendors";

export default function EditVendor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<Partial<VendorFormData> | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getVendor(id)
      .then((vendor) => {
        setInitialData({
          name: vendor.name,
          vendorCode: vendor.vendorCode,
          category: vendor.category,
          contactPerson: vendor.contactPerson,
          mobile: vendor.mobile,
          email: vendor.email,
          address: vendor.address,
          city: vendor.city,
          state: vendor.state,
          pincode: vendor.pincode,
          gst: vendor.gst,
          pan: vendor.pan,
          bankName: vendor.bankName,
          accountNumber: vendor.accountNumber,
          ifscCode: vendor.ifscCode,
          notes: vendor.notes,
          status: vendor.status,
        });
      })
      .catch(() => setError("Failed to load vendor."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: VendorFormData) => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      await updateVendor(id, data);
      navigate("/vendors");
    } catch {
      setError("Failed to update vendor. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Vendor</h1>
          <p className="mt-2 text-slate-500">Update vendor information.</p>
        </div>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>
        )}
        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading vendor...</div>
        ) : (
          <VendorForm initialData={initialData} onSubmit={handleSubmit} saving={saving} />
        )}
      </div>
    </Layout>
  );
}
