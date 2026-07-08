interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

export default function ClientFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: Props) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">

      <div className="grid gap-4 md:grid-cols-2">

        <input
          type="text"
          placeholder="Search company, contact, mobile or GST..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-lg border p-3 outline-none focus:border-blue-500"
        />

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border p-3 outline-none focus:border-blue-500"
        >
          <option value="">All Clients</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

      </div>

    </div>
  );
}