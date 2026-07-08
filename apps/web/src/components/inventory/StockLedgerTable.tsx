import type { StockLedgerEntry } from "../../services/inventory";

const MOVEMENT_LABELS: Record<string, string> = {
  OPENING: "Opening",
  RECEIPT: "Receipt",
  ISSUE: "Issue",
  ADJUSTMENT: "Adjustment",
};

const MOVEMENT_COLORS: Record<string, string> = {
  OPENING: "bg-slate-100 text-slate-600",
  RECEIPT: "bg-emerald-100 text-emerald-700",
  ISSUE: "bg-amber-100 text-amber-700",
  ADJUSTMENT: "bg-sky-100 text-sky-700",
};

interface Props {
  entries?: StockLedgerEntry[];
  showItemColumn?: boolean;
}

export default function StockLedgerTable({ entries = [], showItemColumn = false }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-6 py-4 text-left">Date</th>
            {showItemColumn && <th className="px-6 py-4 text-left">Item</th>}
            <th className="px-6 py-4 text-left">Type</th>
            <th className="px-6 py-4 text-right">Quantity</th>
            <th className="px-6 py-4 text-right">Balance After</th>
            <th className="px-6 py-4 text-left">Reference</th>
            <th className="px-6 py-4 text-left">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={showItemColumn ? 7 : 6} className="py-10 text-center text-slate-500">
                No stock movements found.
              </td>
            </tr>
          ) : (
            entries.map((entry) => (
              <tr key={entry.id} className="border-t hover:bg-slate-50">
                <td className="px-6 py-4">{new Date(entry.movementDate).toLocaleString()}</td>
                {showItemColumn && (
                  <td className="px-6 py-4">
                    <div className="font-medium">{entry.item?.itemName ?? "—"}</div>
                    <div className="text-xs text-slate-400">{entry.item?.itemCode ?? ""}</div>
                  </td>
                )}
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${MOVEMENT_COLORS[entry.movementType] ?? "bg-slate-100 text-slate-600"}`}>
                    {MOVEMENT_LABELS[entry.movementType] ?? entry.movementType}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-medium">{entry.quantity}</td>
                <td className="px-6 py-4 text-right">{entry.balanceAfter}</td>
                <td className="px-6 py-4 text-slate-500">
                  {entry.referenceNumber || entry.referenceType || "—"}
                </td>
                <td className="px-6 py-4 text-slate-500">{entry.remarks || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
