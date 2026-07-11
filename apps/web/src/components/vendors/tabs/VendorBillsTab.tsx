import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import VendorBillTable from "../../vendor-bills/VendorBillTable";
import { getVendorBills, deleteVendorBill } from "../../../services/vendor-bills";
import type { VendorBill } from "../../../services/vendor-bills";

interface Props {
  vendorId: string;
  onlyOutstanding?: boolean;
}

export default function VendorBillsTab({ vendorId, onlyOutstanding = false }: Props) {
  const navigate = useNavigate();
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getVendorBills({ vendorId, limit: 200 })
      .then((r) => setBills(onlyOutstanding ? r.data.filter((b) => Number(b.outstandingBalance) > 0) : r.data))
      .catch(() => setError("Failed to load bills."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [vendorId, onlyOutstanding]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this vendor bill?")) return;
    try {
      await deleteVendorBill(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete vendor bill.");
    }
  };

  if (loading) return <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <VendorBillTable
      bills={bills}
      onView={(id) => navigate(`/vendor-bills/${id}`)}
      onEdit={(id) => navigate(`/vendor-bills/${id}/edit`)}
      onDelete={handleDelete}
    />
  );
}
