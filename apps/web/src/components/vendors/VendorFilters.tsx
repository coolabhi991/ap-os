import type { VendorFormData } from "../../services/vendors";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
}

export default function VendorFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
}: Props) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        <input
          type="text"
          placeholder="Search vendor, contact, GST..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-lg border p-3 outline-none focus:border-blue-500"
        />

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border p-3 outline-none focus:border-blue-500"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Review">Review</option>
          <option value="Pending">Pending</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-lg border p-3 outline-none focus:border-blue-500"
        >
          <option value="">All Categories</option>
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
    </div>
  );
}

// Silence unused import warning — VendorFormData is referenced from service
export type { VendorFormData };
