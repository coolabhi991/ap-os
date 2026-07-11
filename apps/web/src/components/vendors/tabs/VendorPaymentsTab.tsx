import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import VendorPaymentTable from "../../vendor-payments/VendorPaymentTable";
import { getVendorPayments } from "../../../services/vendor-payments";
import type { VendorPayment } from "../../../services/vendor-payments";

export default function VendorPaymentsTab({ vendorId }: { vendorId: string }) {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVendorPayments({ vendorId, limit: 200 })
      .then((r) => setPayments(r.data))
      .catch(() => setError("Failed to load payments."))
      .finally(() => setLoading(false));
  }, [vendorId]);

  if (loading) return <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => navigate("/vendor-payments/new")} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Record Payment
        </button>
      </div>
      <VendorPaymentTable payments={payments} onView={(id) => navigate(`/vendor-payments/${id}`)} />
    </div>
  );
}
