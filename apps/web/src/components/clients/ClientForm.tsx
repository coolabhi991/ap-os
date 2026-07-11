import { useState } from "react";
import type { ClientFormData } from "../../services/clients";

interface Props {
  initialData?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => void;
  saving?: boolean;
}

export default function ClientForm({
  initialData,
  onSubmit,
  saving = false,
}: Props) {
  const [form, setForm] = useState<ClientFormData>({
    companyName: initialData?.companyName ?? "",
    clientCode: initialData?.clientCode ?? "",
    contactPerson: initialData?.contactPerson ?? "",
    mobile: initialData?.mobile ?? "",
    email: initialData?.email ?? "",
    gst: initialData?.gst ?? "",
    pan: initialData?.pan ?? "",
    address: initialData?.address ?? "",
    city: initialData?.city ?? "",
    state: initialData?.state ?? "",
    pincode: initialData?.pincode ?? "",
    website: initialData?.website ?? "",
    status: initialData?.status ?? "Active",
    notes: initialData?.notes ?? "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl bg-white p-8 shadow-sm"
    >
      <div className="grid gap-6 md:grid-cols-2">

        <div>
          <label className="mb-2 block font-medium">
            Company Name *
          </label>
          <input
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Client Code
          </label>
          <input
            name="clientCode"
            value={form.clientCode}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Contact Person
          </label>
          <input
            name="contactPerson"
            value={form.contactPerson}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Mobile
          </label>
          <input
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            GST Number
          </label>
          <input
            name="gst"
            value={form.gst}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            PAN Number
          </label>
          <input
            name="pan"
            value={form.pan}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Website
          </label>
          <input
            name="website"
            value={form.website}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            City
          </label>
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            State
          </label>
          <input
            name="state"
            value={form.state}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Pincode
          </label>
          <input
            name="pincode"
            value={form.pincode}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Status
          </label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

      </div>

      <div>
        <label className="mb-2 block font-medium">
          Address
        </label>
        <textarea
          rows={3}
          name="address"
          value={form.address}
          onChange={handleChange}
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Notes
        </label>
        <textarea
          rows={4}
          name="notes"
          value={form.notes}
          onChange={handleChange}
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          className="rounded-lg border px-6 py-3"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Client"}
        </button>
      </div>
    </form>
  );
}