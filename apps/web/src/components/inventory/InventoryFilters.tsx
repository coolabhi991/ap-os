interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  warehouseFilter: string;
  onWarehouseChange: (value: string) => void;
}

export default function InventoryFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  warehouseFilter,
  onWarehouseChange,
}: Props) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-4">
        <input
          type="text"
          placeholder="Search item, code, batch..."
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
          <option value="HEALTHY">Healthy</option>
          <option value="LOW">Low</option>
          <option value="CRITICAL">Critical</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>

        <input
          type="text"
          placeholder="Category"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-lg border p-3 outline-none focus:border-blue-500"
        />

        <input
          type="text"
          placeholder="Warehouse"
          value={warehouseFilter}
          onChange={(e) => onWarehouseChange(e.target.value)}
          className="rounded-lg border p-3 outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}
