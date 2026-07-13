import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import EmployeeForm from "../../components/employees/EmployeeForm";
import type { EmployeeFormData } from "../../services/employees";
import { createEmployee } from "../../services/employees";

export default function AddEmployee() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: EmployeeFormData) => {
    try {
      setSaving(true);
      setError(null);
      await createEmployee(data);
      navigate("/employees");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create employee. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">New Employee</h1>
          <p className="mt-2 text-slate-500">Register internal staff for financial tracking.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        <EmployeeForm onSubmit={handleSubmit} saving={saving} />
      </div>
    </Layout>
  );
}
