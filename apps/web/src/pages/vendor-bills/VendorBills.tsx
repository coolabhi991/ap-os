import { useEffect, useState } from "react";
import { Plus, Download, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import VendorBillFilters from "../../components/vendor-bills/VendorBillFilters";
import VendorBillTable from "../../components/vendor-bills/VendorBillTable";

import { getVendorBills, deleteVendorBill, exportVendorBillsCSV } from "../../services/vendor-bills";
import type { VendorBill } from "../../services/vendor-bills";
import LoadingState from "../../components/ui/LoadingState";

export default function VendorBills() {
  const navigate = useNavigate();

  const [bills, setBills] = useState<VendorBill[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const query = {
    search: search || undefined,
    status: statusFilter || undefined,
    overdue: overdueOnly || undefined,
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getVendorBills(query);
      setBills(result.data);
    } catch {
      setError("Failed to load vendor bills. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, overdueOnly]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this vendor bill?")) return;
    try {
      await deleteVendorBill(id);
      setBills((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete vendor bill.");
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportVendorBillsCSV(query);
    } catch {
      alert("Failed to export vendor bills.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vendor Bills</h1>
            <p className="mt-2 text-slate-500">Track vendor invoices, payments, and outstanding balances.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/vendor-bills/dashboard")}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <Download size={18} />
              {exporting ? "Exporting..." : "Export"}
            </button>
            <button
              onClick={() => navigate("/vendor-bills/new")}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              New Bill
            </button>
          </div>
        </div>

        <VendorBillFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          overdueOnly={overdueOnly}
          onOverdueChange={setOverdueOnly}
        />

        {loading && (
          <LoadingState label="Loading vendor bills..." />
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>
        )}

        {!loading && !error && (
          <VendorBillTable
            bills={bills}
            onView={(id) => navigate(`/vendor-bills/${id}`)}
            onEdit={(id) => navigate(`/vendor-bills/${id}/edit`)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </Layout>
  );
}
