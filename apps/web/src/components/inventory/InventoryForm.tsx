import { useState } from "react";
import type { InventoryFormData } from "../../services/inventory";

interface Option {
  id: string;
  name: string;
}

interface FormState {
  itemCode: string;
  itemName: string;
  category: string;
  unit: string;
  projectId: string;
  openingBalance: string;
  reservedStock: string;
  reorderLevel: string;
  minStock: string;
  maxStock: string;
  warehouse: string;
  rackLocation: string;
  batchNumber: string;
  supplierId: string;
  location: string;
}

interface Props {
  initialData?: Partial<InventoryFormData>;
  projects?: Option[];
  suppliers?: Option[];
  onSubmit: (data: InventoryFormData) => void;
  saving?: boolean;
  isEdit?: boolean;
}

export default function InventoryForm({
  initialData,
  projects = [],
  suppliers = [],
  onSubmit,
  saving = false,
  isEdit = false,
}: Props) {
  const [form, setForm] = useState<FormState>({
    itemCode: initialData?.itemCode ?? "",
    itemName: initialData?.itemName ?? "",
    category: initialData?.category ?? "",
    unit: initialData?.unit ?? "",
    projectId: initialData?.projectId ?? "",
    openingBalance: initialData?.openingBalance !== undefined ? String(initialData.openingBalance) : "0",
    reservedStock: initialData?.reservedStock !== undefined ? String(initialData.reservedStock) : "0",
    reorderLevel: initialData?.reorderLevel !== undefined ? String(initialData.reorderLevel) : "0",
    minStock: initialData?.minStock !== undefined ? String(initialData.minStock) : "0",
    maxStock: initialData?.maxStock !== undefined ? String(initialData.maxStock) : "0",
    warehouse: initialData?.warehouse ?? "",
    rackLocation: initialData?.rackLocation ?? "",
    batchNumber: initialData?.batchNumber ?? "",
    supplierId: initialData?.supplierId ?? "",
    location: initialData?.location ?? "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({
      itemCode: form.itemCode,
      itemName: form.itemName,
      category: form.category,
      unit: form.unit,
      projectId: form.projectId,
      openingBalance: Number(form.openingBalance) || 0,
      reservedStock: Number(form.reservedStock) || 0,
      reorderLevel: Number(form.reorderLevel) || 0,
      minStock: Number(form.minStock) || 0,
      maxStock: Number(form.maxStock) || 0,
      warehouse: form.warehouse,
      rackLocation: form.rackLocation,
      batchNumber: form.batchNumber,
      supplierId: form.supplierId,
      location: form.location,
    });
  };

  const field = (
    label: string,
    name: keyof FormState,
    type = "text"
  ) => (
    <div>
      <label className="mb-2 block font-medium">{label}</label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
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
          {field("Item Name *", "itemName")}
          {field("Item Code", "itemCode")}

          <div>
            <label className="mb-2 block font-medium">Category</label>
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="e.g. Cement, Steel, Electrical"
              className="w-full rounded-lg border p-3"
            />
          </div>

          {field("Unit", "unit")}

          <div>
            <label className="mb-2 block font-medium">Project</label>
            <select name="projectId" value={form.projectId} onChange={handleChange} className="w-full rounded-lg border p-3">
              <option value="">Not project-specific</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Supplier</label>
            <select name="supplierId" value={form.supplierId} onChange={handleChange} className="w-full rounded-lg border p-3">
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stock Levels */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Stock Levels</h2>
        {isEdit && (
          <p className="mb-4 text-sm text-slate-400">
            Opening stock is fixed at creation. Current stock updates automatically from Material
            Receipts — use &ldquo;Adjust Stock&rdquo; on the item&apos;s detail page for manual corrections.
          </p>
        )}
        <div className="grid gap-6 md:grid-cols-3">
          {!isEdit && field("Opening Stock", "openingBalance", "number")}
          {field("Reserved Stock", "reservedStock", "number")}
          {field("Reorder Level", "reorderLevel", "number")}
          {field("Minimum Stock", "minStock", "number")}
          {field("Maximum Stock", "maxStock", "number")}
        </div>
      </div>

      {/* Location */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Storage Location</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {field("Warehouse", "warehouse")}
          {field("Rack Location", "rackLocation")}
          {field("Batch Number", "batchNumber")}
          {field("Location (general)", "location")}
        </div>
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
          {saving ? "Saving..." : "Save Item"}
        </button>
      </div>
    </form>
  );
}
