import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, FileBarChart } from "lucide-react";

import Layout from "../../components/layout/Layout";
import BankAccountsPanel from "../../components/banking/BankAccountsPanel";
import { getEmployee, EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from "../../services/employees";
import type { Employee } from "../../services/employees";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-3 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value || "—"}</span>
    </div>
  );
}

export default function ViewEmployee() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getEmployee(id)
      .then(setEmployee)
      .catch(() => setError("Employee not found or failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading employee...</div>
      </Layout>
    );
  }

  if (error || !employee) {
    return (
      <Layout>
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-8 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{employee.name}</h1>
            <p className="mt-2 text-slate-500">{employee.designation || "—"}{employee.department && ` • ${employee.department}`}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-4 py-2 font-medium ${EMPLOYEE_STATUS_COLORS[employee.status]}`}>
              {EMPLOYEE_STATUS_LABELS[employee.status]}
            </span>
            <button
              onClick={() => navigate(`/employees/reports?employeeId=${employee.id}`)}
              className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50"
            >
              <FileBarChart className="h-4 w-4" /> View Report
            </button>
            <button
              onClick={() => navigate(`/employees/${employee.id}/edit`)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm text-white hover:bg-blue-700"
            >
              <Pencil className="h-4 w-4" /> Edit
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">Employee Details</h2>
            <Row label="Mobile" value={employee.mobile} />
            <Row label="Designation" value={employee.designation} />
            <Row label="Department" value={employee.department} />
          </div>
          <BankAccountsPanel ownerType="EMPLOYEE" ownerId={employee.id} />
        </div>
      </div>
    </Layout>
  );
}
