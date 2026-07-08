import { useEffect, useState } from "react";
import { Plus, Download } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import PaymentTable from "../../components/labour/PaymentTable";
import { getLabourPayments, deleteLabourPayment, exportLabourPaymentsCSV } from "../../services/labour-payments";
import type { LabourPayment } from "../../services/labour-payments";

export default function Payments() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const labourId = searchParams.get("labourId") ?? "";

  const [payments, setPayments] = useState<LabourPayment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const query = { search: search || undefined, labourId: labourId || undefined };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getLabourPayments(query);
      setPayments(result.data);
    } catch {
      setError("Failed to load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, labourId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this payment?")) return;
    try {
      await deleteLabourPayment(id);
      setPayments((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete payment.");
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportLabourPaymentsCSV(query);
    } catch {
      alert("Failed to export payments.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Labour Payments</h1>
            <p className="mt-2 text-slate-500">Wage settlements paid to workers.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50 disabled:opacity-60">
              <Download size={18} /> {exporting ? "Exporting..." : "Export"}
            </button>
            <button onClick={() => navigate("/labour/payments/new")} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
              <Plus size={18} /> Record Payment
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <input
            type="text"
            placeholder="Search worker, remarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
          />
        </div>

        {loading && <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}
        {!loading && !error && <PaymentTable payments={payments} onDelete={handleDelete} />}
      </div>
    </Layout>
  );
}
