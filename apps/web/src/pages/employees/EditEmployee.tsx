import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import EmployeeForm from "../../components/employees/EmployeeForm";
import type { EmployeeFormData } from "../../services/employees";
import { getEmployee, updateEmployee } from "../../services/employees";

export default function EditEmployee() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<Partial<EmployeeFormData> | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getEmployee(id)
      .then((e) => setInitialData({ name: e.name, mobile: e.mobile, designation: e.designation, department: e.department, status: e.status }))
      .catch(() => setError("Failed to load employee."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: EmployeeFormData) => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      await updateEmployee(id, data);
      navigate("/employees");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update employee. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Employee</h1>
          <p className="mt-2 text-slate-500">Update employee information.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading employee...</div>
        ) : (
          <EmployeeForm initialData={initialData} onSubmit={handleSubmit} saving={saving} />
        )}
      </div>
    </Layout>
  );
}
