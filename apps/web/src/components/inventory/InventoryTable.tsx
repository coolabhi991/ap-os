import { Eye, Pencil, Trash2 } from "lucide-react";
import type { InventoryItem } from "../../services/inventory";
import { INVENTORY_STATUS_LABELS, INVENTORY_STATUS_COLORS } from "../../services/inventory";

interface Props {
  items?: InventoryItem[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function InventoryTable({
  items = [],
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-6 py-4 text-left">Item</th>
            <th className="px-6 py-4 text-left">Category</th>
            <th className="px-6 py-4 text-left">Warehouse</th>
            <th className="px-6 py-4 text-right">Current Stock</th>
            <th className="px-6 py-4 text-right">Reorder Level</th>
            <th className="px-6 py-4 text-left">Supplier</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-10 text-center text-slate-500">
                No inventory items found.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className="border-t hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-medium">{item.itemName}</div>
                  <div className="text-xs text-slate-400">{item.itemCode || "—"}</div>
                </td>
                <td className="px-6 py-4">{item.category || "—"}</td>
                <td className="px-6 py-4">
                  {item.warehouse || "—"}
                  {item.rackLocation && <div className="text-xs text-slate-400">{item.rackLocation}</div>}
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  {item.currentStock} {item.unit}
                </td>
                <td className="px-6 py-4 text-right text-slate-500">{item.reorderLevel}</td>
                <td className="px-6 py-4">{item.supplier?.name || "—"}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      INVENTORY_STATUS_COLORS[item.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {INVENTORY_STATUS_LABELS[item.status] ?? item.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-4">
                    <button onClick={() => onView(item.id)}>
                      <Eye size={18} className="text-blue-600" />
                    </button>
                    <button onClick={() => onEdit(item.id)}>
                      <Pencil size={18} className="text-green-600" />
                    </button>
                    <button onClick={() => onDelete(item.id)}>
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
