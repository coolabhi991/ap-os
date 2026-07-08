import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import { getMaterialIssue } from "../../services/material-issues";
import type { MaterialIssue } from "../../services/material-issues";
import { getStockLedger } from "../../services/inventory";
import type { StockLedgerEntry } from "../../services/inventory";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-semibold">{value || "—"}</p>
    </div>
  );
}

export default function ViewMaterialIssue() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<MaterialIssue | null>(null);
  const [ledger, setLedger] = useState<StockLedgerEntry[]>([]);
  const [ownEntry, setOwnEntry] = useState<StockLedgerEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getMaterialIssue(id)
      .then(async (data) => {
        setIssue(data);
        if (data.inventoryId) {
          const result = await getStockLedger({ inventoryId: data.inventoryId, limit: 25 });
          setLedger(result.data);
          setOwnEntry(result.data.find((e) => e.referenceId === data.id) ?? null);
        }
      })
      .catch(() => setError("Material issue not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div></Layout>;
  if (error || !issue) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Material Issue Not Found</h1>
          <p className="mt-2 text-slate-500">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-sm text-blue-600">{issue.issueNumber}</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">{issue.itemName}</h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                {issue.project && <span>Project: <strong>{issue.project.name}</strong></span>}
                <span>Date: <strong>{issue.issuedDate}</strong></span>
                {issue.warehouse && <span>Warehouse: <strong>{issue.warehouse}</strong></span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
                {Number(issue.quantity).toLocaleString("en-IN")} {issue.unit}
              </span>
              <button onClick={() => navigate(`/material-issues/${issue.id}/edit`)} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Edit</button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">Material Details</h2>
            <div className="space-y-4">
              <Row label="Material" value={issue.itemName} />
              <Row label="Warehouse" value={issue.warehouse} />
              <Row label="Current Stock (now)" value={issue.inventory ? `${issue.inventory.currentStock} ${issue.unit}` : ""} />
              <Row label="Available Stock (now)" value={issue.inventory ? `${issue.inventory.availableStock} ${issue.unit}` : ""} />
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">Issue Details</h2>
            <div className="space-y-4">
              <Row label="Purpose" value={issue.purpose} />
              <Row label="Issued To" value={issue.issuedTo} />
              <Row label="Approved By" value={issue.approvedBy} />
              <Row label="Remarks" value={issue.remarks} />
              <Row label="Created By" value={issue.createdBy?.name ?? ""} />
              <Row label="Created At" value={new Date(issue.createdAt).toLocaleString()} />
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
            <h2 className="mb-5 text-xl font-bold">Attachment</h2>
            {issue.attachmentFileName || issue.attachmentFileUrl ? (
              <div className="space-y-2">
                <Row label="File Name" value={issue.attachmentFileName} />
                {issue.attachmentFileUrl && (
                  <a href={issue.attachmentFileUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                    Open attachment
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No attachment on file.</p>
            )}
          </div>

          {ownEntry && (
            <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
              <h2 className="mb-5 text-xl font-bold">Ledger Reference</h2>
              <div className="grid gap-4 md:grid-cols-4">
                <Row label="Movement Type" value={ownEntry.movementType} />
                <Row label="Quantity" value={`${ownEntry.quantity} ${issue.unit}`} />
                <Row label="Balance After" value={`${ownEntry.balanceAfter} ${issue.unit}`} />
                <Row label="Movement Date" value={new Date(ownEntry.movementDate).toLocaleString()} />
              </div>
            </div>
          )}

          <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
            <h2 className="mb-5 text-xl font-bold">Stock Movement History — {issue.itemName}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Type</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Quantity</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Balance After</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ledger.length === 0 ? (
                    <tr><td colSpan={5} className="py-6 text-center text-slate-500">No stock movements found.</td></tr>
                  ) : (
                    ledger.map((e) => (
                      <tr key={e.id} className={e.referenceId === issue.id ? "bg-blue-50" : ""}>
                        <td className="px-4 py-3">{new Date(e.movementDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{e.movementType}</td>
                        <td className="px-4 py-3 text-right">{e.quantity}</td>
                        <td className="px-4 py-3 text-right">{e.balanceAfter}</td>
                        <td className="px-4 py-3 font-mono text-xs">{e.referenceNumber || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
