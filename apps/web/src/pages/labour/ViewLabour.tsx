import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import WageRatePanel from "../../components/labour/WageRatePanel";
import { getLabour } from "../../services/labour";
import type { Labour } from "../../services/labour";
import { LABOUR_CATEGORY_LABELS } from "../../services/labour";
import { getWageRegister } from "../../services/labour-reports";
import type { WageSummaryRow } from "../../services/labour-reports";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-semibold">{value || "—"}</p>
    </div>
  );
}

export default function ViewLabour() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [labour, setLabour] = useState<Labour | null>(null);
  const [summary, setSummary] = useState<WageSummaryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = (labourId: string) => {
    getWageRegister({ labourId })
      .then((rows) => setSummary(rows[0] ?? null))
      .catch(() => {});
  };

  useEffect(() => {
    if (!id) return;
    getLabour(id)
      .then((data) => {
        setLabour(data);
        loadSummary(id);
      })
      .catch(() => setError("Labour record not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div></Layout>;
  if (error || !labour) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Labour Not Found</h1>
          <p className="mt-2 text-slate-500">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{labour.name}</h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                <span>{LABOUR_CATEGORY_LABELS[labour.category] ?? labour.category}</span>
                {labour.designation && <span>{labour.designation}</span>}
                {labour.project && <span>Project: <strong>{labour.project.name}</strong></span>}
                {labour.contractor && <span>Contractor: <strong>{labour.contractor.name}</strong></span>}
                {labour.group && <span>Group: <strong>{labour.group.name}</strong></span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-4 py-2 text-sm font-medium ${labour.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                {labour.status}
              </span>
              <button onClick={() => navigate(`/labour/${labour.id}/edit`)} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Edit</button>
            </div>
          </div>
        </div>

        {summary && (
          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Days Present</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{summary.daysPresent}</h2>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Wage Earned</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">₹{Number(summary.wageEarned).toLocaleString("en-IN")}</h2>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Advances + Payments</p>
              <h2 className="mt-2 text-2xl font-bold text-emerald-600">₹{(Number(summary.totalAdvances) + Number(summary.totalPayments)).toLocaleString("en-IN")}</h2>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Pending Wages</p>
              <h2 className="mt-2 text-2xl font-bold text-red-600">₹{Number(summary.pendingWages).toLocaleString("en-IN")}</h2>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">Worker Details</h2>
            <div className="space-y-4">
              <Row label="Phone" value={labour.phone} />
              <Row label="Remarks" value={labour.remarks} />
              <Row label="Created By" value={labour.createdBy?.name ?? ""} />
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">Quick Links</h2>
            <div className="flex flex-col gap-3">
              <button onClick={() => navigate(`/labour/attendance?labourId=${labour.id}`)} className="rounded-lg border px-4 py-2 text-left text-sm hover:bg-slate-50">
                View Attendance History
              </button>
              <button onClick={() => navigate(`/labour/advances?labourId=${labour.id}`)} className="rounded-lg border px-4 py-2 text-left text-sm hover:bg-slate-50">
                View Advances
              </button>
              <button onClick={() => navigate(`/labour/payments?labourId=${labour.id}`)} className="rounded-lg border px-4 py-2 text-left text-sm hover:bg-slate-50">
                View Payments
              </button>
            </div>
          </div>
        </div>

        <WageRatePanel labourId={labour.id} onRateAdded={() => loadSummary(labour.id)} />
      </div>
    </Layout>
  );
}
