import { AlertTriangle } from "lucide-react";
import type { InventoryItem } from "../../services/inventory";
import { INVENTORY_STATUS_LABELS, INVENTORY_STATUS_COLORS } from "../../services/inventory";

interface Props {
  items?: InventoryItem[];
  onView?: (id: string) => void;
}

export default function LowStockAlerts({ items = [], onView }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle size={18} className="text-amber-500" />
        <h2 className="text-lg font-semibold text-slate-800">Low Stock Alerts</h2>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          All items are within healthy stock levels.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onView?.(item.id)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
            >
              <div>
                <p className="font-medium text-slate-800">{item.itemName}</p>
                <p className="text-xs text-slate-400">
                  {item.itemCode || "—"} • {item.warehouse || "No warehouse"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">
                  {item.currentStock} {item.unit}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    INVENTORY_STATUS_COLORS[item.status] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {INVENTORY_STATUS_LABELS[item.status] ?? item.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
