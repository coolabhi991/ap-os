import { useEffect, useState } from "react";
import { getBankDirectory } from "../../services/bank-directory";
import type { BankDirectory, BankDirectoryRow } from "../../services/bank-directory";
import LoadingState from "../ui/LoadingState";
import EmptyTableRow from "../ui/EmptyTableRow";

function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return `••••${accountNumber.slice(-4)}`;
}

function DirectorySection({ title, rows }: { title: string; rows: BankDirectoryRow[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">{title} ({rows.length})</h3>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Owner</th>
              <th className="px-4 py-3 text-left">Bank</th>
              <th className="px-4 py-3 text-left">Branch</th>
              <th className="px-4 py-3 text-left">Account Number</th>
              <th className="px-4 py-3 text-left">IFSC</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyTableRow colSpan={6}>No accounts.</EmptyTableRow>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 font-medium">
                    {r.ownerName}
                    {r.isPrimary && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Primary</span>}
                  </td>
                  <td className="px-4 py-3">{r.bankName}</td>
                  <td className="px-4 py-3">{r.branch || "—"}</td>
                  <td className="px-4 py-3 font-mono">{maskAccountNumber(r.accountNumber)}</td>
                  <td className="px-4 py-3">{r.ifscCode}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BankDirectoryTab() {
  const [directory, setDirectory] = useState<BankDirectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBankDirectory()
      .then(setDirectory)
      .catch(() => setError("Failed to load the Bank Directory."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error || !directory) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Bank Directory</h2>
        <p className="text-sm text-slate-500">
          A centralized, read-only view of every bank account across the company — {directory.totalAccounts} account(s) total.
          Accounts are created and maintained only inside their own modules (Banking, Vendors, Employees, Partnership).
        </p>
      </div>
      <DirectorySection title="Company Accounts" rows={directory.company} />
      <DirectorySection title="Vendor Accounts" rows={directory.vendor} />
      <DirectorySection title="Employee Accounts" rows={directory.employee} />
      <DirectorySection title="Partner Accounts" rows={directory.partner} />
    </div>
  );
}
