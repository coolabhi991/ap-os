import { useState } from "react";
import { X, Upload } from "lucide-react";
import { parseBankStatementFile } from "../../lib/bank-import-parser";
import type { ParsedImportResult } from "../../lib/bank-import-parser";
import { importBankTransactions } from "../../services/bank-transactions";
import type { BankAccountBalance } from "../../services/bank-transactions";

interface Props {
  accounts: BankAccountBalance[];
  onClose: () => void;
  onImported: () => void;
}

export default function ImportTransactionsModal({ accounts, onClose, onImported }: Props) {
  const [companyBankAccountId, setCompanyBankAccountId] = useState(accounts[0]?.id ?? "");
  const [parsed, setParsed] = useState<ParsedImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParsing(true);
    setError(null);
    setParsed(null);
    try {
      const result = await parseBankStatementFile(file);
      if (!result.rows.length) throw new Error("No valid transactions found in this file.");
      setParsed(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse the file.");
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!parsed || !companyBankAccountId) return;
    setImporting(true);
    setError(null);
    try {
      const result = await importBankTransactions(companyBankAccountId, parsed.rows);
      alert(`Imported ${result.count} transaction${result.count === 1 ? "" : "s"}. Run Auto-Reconcile next to match them.`);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import transactions.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Import Bank Transactions</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Bank Account *</label>
            <select value={companyBankAccountId} onChange={(e) => setCompanyBankAccountId(e.target.value)} className="w-full rounded-lg border p-2.5">
              <option value="">Select account</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.nickname || a.bankName} — {a.accountNumber}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Statement File (.xlsx or .csv) *</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-6 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600">
              <Upload className="h-5 w-5" />
              {fileName || "Click to choose a file"}
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
            </label>
            <p className="mt-1 text-xs text-slate-400">Columns are auto-detected: Date, Deposit/Credit, Withdrawal/Debit, Reference, Description, Category.</p>
          </div>

          {parsing && <p className="text-sm text-slate-500">Parsing file...</p>}

          {parsed && (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                Found <span className="font-semibold">{parsed.rows.length}</span> transaction{parsed.rows.length === 1 ? "" : "s"} to import
                {parsed.skipped > 0 && <span className="text-amber-600"> ({parsed.skipped} row{parsed.skipped === 1 ? "" : "s"} skipped — missing date or amount)</span>}.
              </p>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-slate-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-left">Reference</th>
                      <th className="px-3 py-2 text-right">Deposit</th>
                      <th className="px-3 py-2 text-right">Withdrawal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.slice(0, 100).map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{r.transactionDate}</td>
                        <td className="px-3 py-2">{r.description || "—"}</td>
                        <td className="px-3 py-2">{r.referenceNumber || "—"}</td>
                        <td className="px-3 py-2 text-right">{r.deposit ? `₹${r.deposit.toLocaleString("en-IN")}` : "—"}</td>
                        <td className="px-3 py-2 text-right">{r.withdrawal ? `₹${r.withdrawal.toLocaleString("en-IN")}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsed.rows.length > 100 && <p className="text-xs text-slate-400">Showing first 100 of {parsed.rows.length} rows.</p>}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-5 py-2.5">Cancel</button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!parsed || !companyBankAccountId || importing}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {importing ? "Importing..." : `Import ${parsed ? parsed.rows.length : ""} Transactions`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
