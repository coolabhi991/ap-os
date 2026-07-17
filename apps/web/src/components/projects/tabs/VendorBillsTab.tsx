import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import VendorBillTable from "../../vendor-bills/VendorBillTable";
import { getVendorBills, deleteVendorBill } from "../../../services/vendor-bills";
import type { VendorBill } from "../../../services/vendor-bills";
import LoadingState from "../../ui/LoadingState";

export default function VendorBillsTab({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getVendorBills({ projectId, page: 1, limit: 50, sortBy: "billDate", sortOrder: "desc" })
      .then((res) => setBills(res.data))
      .catch(() => setError("Failed to load Vendor Bills."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [projectId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this vendor bill?")) return;
    await deleteVendorBill(id);
    load();
  };

  if (loading) return <LoadingState label="Loading Vendor Bills..." />;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Vendor Bills</h2>
        <button onClick={() => navigate(`/vendor-bills/new?projectId=${projectId}`)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Plus size={16} /> Add Vendor Bill
        </button>
      </div>

      <VendorBillTable
        bills={bills}
        onView={(id) => navigate(`/vendor-bills/${id}`)}
        onEdit={(id) => navigate(`/vendor-bills/${id}/edit`)}
        onDelete={handleDelete}
      />
    </div>
  );
}
