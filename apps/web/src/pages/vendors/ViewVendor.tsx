import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import VendorOverview from "../../components/vendors/VendorOverview";
import { getVendor } from "../../services/vendors";
import type { Vendor } from "../../services/vendors";

export default function ViewVendor() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getVendor(id)
      .then(setVendor)
      .catch(() => setError("Vendor not found or failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">
          Loading vendor...
        </div>
      </Layout>
    );
  }

  if (error || !vendor) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Vendor Not Found</h1>
          <p className="mt-2 text-slate-500">{error ?? "This vendor does not exist."}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <VendorOverview vendor={vendor} />
    </Layout>
  );
}
