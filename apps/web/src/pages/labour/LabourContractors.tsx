import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import VendorTable from "../../components/vendors/VendorTable";
import { getVendors, deleteVendor } from "../../services/vendors";
import type { Vendor } from "../../services/vendors";

/**
 * Labour Contractors are deliberately just Vendors filtered to category "Labour" —
 * not a separate entity — so contractor payments reuse the existing Vendor Bill /
 * Vendor Payment pipeline directly. This page reuses VendorTable as-is.
 */
export default function LabourContractors() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getVendors({ search: search || undefined, category: "Labour", limit: 100 });
      setVendors(result.data);
    } catch {
      setError("Failed to load labour contractors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this contractor?")) return;
    try {
      await deleteVendor(id);
      setVendors((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete contractor.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Labour Contractors</h1>
            <p className="mt-2 text-slate-500">Vendors categorized as "Labour" — pay them through Vendor Bills / Vendor Payments.</p>
          </div>
          <button onClick={() => navigate("/vendors/new")} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
            <Plus size={18} /> New Contractor
          </button>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <input
            type="text"
            placeholder="Search contractor name, contact, GST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
          />
        </div>

        {loading && <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}
        {!loading && !error && (
          <VendorTable
            vendors={vendors}
            onView={(id) => navigate(`/vendors/${id}`)}
            onEdit={(id) => navigate(`/vendors/${id}/edit`)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </Layout>
  );
}
