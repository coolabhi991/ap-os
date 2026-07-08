interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  overdueOnly: boolean;
  onOverdueChange: (value: boolean) => void;
}

export default function VendorBillFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  overdueOnly,
  onOverdueChange,
}: Props) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        <input
          type="text"
          placeholder="Search bill number, vendor..."
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
          <option value="PENDING">Pending</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <label className="flex items-center gap-2 rounded-lg border p-3">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => onOverdueChange(e.target.checked)}
          />
          <span>Overdue only</span>
        </label>
      </div>
    </div>
  );
}
