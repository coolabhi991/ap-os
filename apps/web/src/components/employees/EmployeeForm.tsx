import { useState } from "react";
import type { EmployeeFormData } from "../../services/employees";
import { EMPLOYEE_STATUS_OPTIONS, EMPLOYEE_STATUS_LABELS } from "../../services/employees";

interface Props {
  initialData?: Partial<EmployeeFormData>;
  onSubmit: (data: EmployeeFormData) => void;
  saving?: boolean;
}

export default function EmployeeForm({ initialData, onSubmit, saving = false }: Props) {
  const [form, setForm] = useState<EmployeeFormData>({
    name: initialData?.name ?? "",
    mobile: initialData?.mobile ?? "",
    designation: initialData?.designation ?? "",
    department: initialData?.department ?? "",
    status: initialData?.status ?? "ACTIVE",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-xl bg-white p-8 shadow-sm">
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Employee Details</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Employee Name *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full rounded-lg border p-3" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Mobile</label>
            <input type="text" name="mobile" value={form.mobile} onChange={handleChange} className="w-full rounded-lg border p-3" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Designation</label>
            <input type="text" name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Site Engineer" className="w-full rounded-lg border p-3" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Department</label>
            <input type="text" name="department" value={form.department} onChange={handleChange} placeholder="e.g. Operations" className="w-full rounded-lg border p-3" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-lg border p-3">
              {EMPLOYEE_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{EMPLOYEE_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" className="rounded-lg border px-6 py-3">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? "Saving..." : "Save Employee"}
        </button>
      </div>
    </form>
  );
}
