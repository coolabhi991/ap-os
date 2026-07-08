import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import VendorFilters from "../../components/vendors/VendorFilters";
import VendorTable from "../../components/vendors/VendorTable";

import { getVendors, deleteVendor } from "../../services/vendors";
import type { Vendor } from "../../services/vendors";

export default function Vendors() {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getVendors({
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      });
      setVendors(result.data);
    } catch {
      setError("Failed to load vendors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, statusFilter, categoryFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this vendor?")) return;
    try {
      await deleteVendor(id);
      setVendors((prev) => prev.filter((v) => v.id !== id));
    } catch {
      alert("Failed to delete vendor.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vendors</h1>
            <p className="mt-2 text-slate-500">Manage all vendors and suppliers.</p>
          </div>
          <button
            onClick={() => navigate("/vendors/new")}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            New Vendor
          </button>
        </div>

        <VendorFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
        />

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">
            Loading vendors...
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>
        )}

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
