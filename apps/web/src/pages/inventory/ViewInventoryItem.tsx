import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import StockLedgerTable from "../../components/inventory/StockLedgerTable";

import {
  getInventoryItem,
  getStockLedger,
  adjustInventoryStock,
  INVENTORY_STATUS_LABELS,
  INVENTORY_STATUS_COLORS,
} from "../../services/inventory";
import type { InventoryItem, StockLedgerEntry } from "../../services/inventory";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-semibold">{value || "—"}</p>
    </div>
  );
}

export default function ViewInventoryItem() {
  const { id } = useParams<{ id: string }>();

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [ledger, setLedger] = useState<StockLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustDirection, setAdjustDirection] = useState<"IN" | "OUT">("IN");
  const [adjustRemarks, setAdjustRemarks] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [itemResult, ledgerResult] = await Promise.all([
        getInventoryItem(id),
        getStockLedger({ inventoryId: id, limit: 100 }),
      ]);
      setItem(itemResult);
      setLedger(ledgerResult.data);
    } catch {
      setError("Inventory item not found or failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const quantity = Number(adjustQty);
    if (!quantity || quantity <= 0) {
      setAdjustError("Enter a quantity greater than zero.");
      return;
    }
    try {
      setAdjusting(true);
      setAdjustError(null);
      await adjustInventoryStock(id, { quantity, direction: adjustDirection, remarks: adjustRemarks || undefined });
      setShowAdjust(false);
      setAdjustQty("");
      setAdjustRemarks("");
      await load();
    } catch (err) {
      setAdjustError(err instanceof Error ? err.message : "Failed to adjust stock.");
    } finally {
      setAdjusting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">
          Loading inventory item...
        </div>
      </Layout>
    );
  }

  if (error || !item) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Inventory Item Not Found</h1>
          <p className="mt-2 text-slate-500">{error ?? "This inventory item does not exist."}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{item.itemName}</h1>
              <p className="mt-2 text-slate-500">
                {item.itemCode && <span>Code: {item.itemCode} • </span>}
                {item.category && <span>{item.category}</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-4 py-2 font-medium ${
                  INVENTORY_STATUS_COLORS[item.status] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                {INVENTORY_STATUS_LABELS[item.status] ?? item.status}
              </span>
              <button
                onClick={() => setShowAdjust((v) => !v)}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
              >
                Adjust Stock
              </button>
            </div>
          </div>

          {showAdjust && (
            <form onSubmit={handleAdjust} className="mt-6 grid gap-4 rounded-lg border border-slate-200 p-5 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Direction</label>
                <select
                  value={adjustDirection}
                  onChange={(e) => setAdjustDirection(e.target.value as "IN" | "OUT")}
                  className="w-full rounded-lg border p-3"
                >
                  <option value="IN">Add Stock (+)</option>
                  <option value="OUT">Remove Stock (-)</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Quantity</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">Remarks</label>
                <input
                  type="text"
                  value={adjustRemarks}
                  onChange={(e) => setAdjustRemarks(e.target.value)}
                  placeholder="Reason for adjustment"
                  className="w-full rounded-lg border p-3"
                />
              </div>
              {adjustError && (
                <div className="md:col-span-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {adjustError}
                </div>
              )}
              <div className="md:col-span-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAdjust(false)} className="rounded-lg border px-5 py-2.5">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {adjusting ? "Saving..." : "Confirm Adjustment"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Stock summary */}
        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Current Stock</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {item.currentStock} <span className="text-base font-normal text-slate-400">{item.unit}</span>
            </h2>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Reserved Stock</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{item.reservedStock}</h2>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Available Stock</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{item.availableStock}</h2>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Reorder Level</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{item.reorderLevel}</h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">Stock Details</h2>
            <div className="space-y-4">
              <Row label="Opening Stock" value={item.openingBalance} />
              <Row label="Received Quantity" value={item.receiptsQuantity} />
              <Row label="Issued Quantity" value={item.issuesQuantity} />
              <Row label="Minimum Stock" value={item.minStock} />
              <Row label="Maximum Stock" value={item.maxStock} />
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">Storage &amp; Supplier</h2>
            <div className="space-y-4">
              <Row label="Warehouse" value={item.warehouse} />
              <Row label="Rack Location" value={item.rackLocation} />
              <Row label="Batch Number" value={item.batchNumber} />
              <Row label="Supplier" value={item.supplier?.name ?? ""} />
              <Row label="Project" value={item.project?.name ?? ""} />
              <Row label="Last Receipt Date" value={item.lastReceiptDate} />
              <Row label="Last Issue Date" value={item.lastIssueDate} />
            </div>
          </div>
        </div>

        {/* Stock Ledger */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Stock Ledger</h2>
          <StockLedgerTable entries={ledger} />
        </div>
      </div>
    </Layout>
  );
}
