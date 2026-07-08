import { useEffect, useState } from "react";
import { Plus, Download, LayoutDashboard, BookOpenText } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import VendorPaymentFilters from "../../components/vendor-payments/VendorPaymentFilters";
import VendorPaymentTable from "../../components/vendor-payments/VendorPaymentTable";

import { getVendorPayments, exportVendorPaymentsCSV } from "../../services/vendor-payments";
import { getVendors } from "../../services/vendors";
import type { VendorPayment } from "../../services/vendor-payments";

export default function VendorPayments() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getVendors({ limit: 100 }).then((r) => setVendors(r.data)).catch(() => {});
  }, []);

  const query = {
    search: search || undefined,
    vendorId: vendorFilter || undefined,
    mode: modeFilter || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getVendorPayments(query);
      setPayments(result.data);
    } catch {
      setError("Failed to load vendor payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, vendorFilter, modeFilter, fromDate, toDate]);

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportVendorPaymentsCSV(query);
    } catch {
      alert("Failed to export vendor payments.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vendor Payments</h1>
            <p className="mt-2 text-slate-500">Record and track payments made against vendor bills.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/vendor-payments/ledger")}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50"
            >
              <BookOpenText size={18} />
              Vendor Ledger
            </button>
            <button
              onClick={() => navigate("/vendor-payments/dashboard")}
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
              onClick={() => navigate("/vendor-payments/new")}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Record Payment
            </button>
          </div>
        </div>

        <VendorPaymentFilters
          search={search} onSearchChange={setSearch}
          vendorFilter={vendorFilter} onVendorChange={setVendorFilter} vendors={vendors}
          modeFilter={modeFilter} onModeChange={setModeFilter}
          fromDate={fromDate} onFromDateChange={setFromDate}
          toDate={toDate} onToDateChange={setToDate}
        />

        {loading && <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}
        {!loading && !error && (
          <VendorPaymentTable
            payments={payments}
            onView={(id) => navigate(`/vendor-payments/${id}`)}
          />
        )}
      </div>
    </Layout>
  );
}
