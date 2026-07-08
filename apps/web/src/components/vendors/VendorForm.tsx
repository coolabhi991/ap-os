import { useState } from "react";
import type { VendorFormData } from "../../services/vendors";

interface Props {
  initialData?: Partial<VendorFormData>;
  onSubmit: (data: VendorFormData) => void;
  saving?: boolean;
}

export default function VendorForm({ initialData, onSubmit, saving = false }: Props) {
  const [form, setForm] = useState<VendorFormData>({
    name: initialData?.name ?? "",
    vendorCode: initialData?.vendorCode ?? "",
    category: initialData?.category ?? "",
    contactPerson: initialData?.contactPerson ?? "",
    mobile: initialData?.mobile ?? "",
    email: initialData?.email ?? "",
    address: initialData?.address ?? "",
    city: initialData?.city ?? "",
    state: initialData?.state ?? "",
    pincode: initialData?.pincode ?? "",
    gst: initialData?.gst ?? "",
    pan: initialData?.pan ?? "",
    notes: initialData?.notes ?? "",
    status: initialData?.status ?? "Active",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(form);
  };

  const field = (
    label: string,
    name: keyof VendorFormData,
    type = "text"
  ) => (
    <div>
      <label className="mb-2 block font-medium">{label}</label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        className="w-full rounded-lg border p-3"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-xl bg-white p-8 shadow-sm">

      {/* Basic */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Basic Information</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {field("Vendor Name *", "name")}
          {field("Vendor Code", "vendorCode")}

          <div>
            <label className="mb-2 block font-medium">Category</label>
            <select name="category" value={form.category} onChange={handleChange} className="w-full rounded-lg border p-3">
              <option value="">Select Category</option>
              <option value="Materials">Materials</option>
              <option value="Equipment">Equipment</option>
              <option value="Labour">Labour</option>
              <option value="Finishing">Finishing</option>
              <option value="Civil">Civil</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-lg border p-3">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Review">Review</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Contact Information</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {field("Contact Person", "contactPerson")}
          {field("Mobile", "mobile")}
          {field("Email", "email", "email")}
          {field("Address", "address")}
          {field("City", "city")}
          {field("State", "state")}
          {field("Pincode", "pincode")}
        </div>
      </div>

      {/* Tax */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Tax Information</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {field("GST Number", "gst")}
          {field("PAN Number", "pan")}
        </div>
      </div>

      <p className="text-sm text-slate-400">
        Bank accounts are managed separately from the vendor&apos;s detail page after saving.
      </p>

      {/* Notes */}
      <div>
        <label className="mb-2 block font-medium">Notes</label>
        <textarea
          name="notes"
          rows={4}
          value={form.notes}
          onChange={handleChange}
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" className="rounded-lg border px-6 py-3">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Vendor"}
        </button>
      </div>
    </form>
  );
}
