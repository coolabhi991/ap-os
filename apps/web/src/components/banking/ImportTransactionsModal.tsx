import { useEffect, useState } from "react";
import { X, Upload, AlertTriangle } from "lucide-react";
import {
  parseBankStatementFile,
  applyColumnMapping,
  computeFileHash,
  MAPPABLE_FIELD_KEYS,
  FIELD_LABELS,
} from "../../lib/bank-import-parser";
import type { ParsedImportResult, MappingNeededResult, ColumnMapping } from "../../lib/bank-import-parser";
import { importBankTransactions, checkStatementImportDuplicate } from "../../services/bank-transactions";
import type { BankAccountBalance, ImportSummary, StatementImportDuplicateCheck } from "../../services/bank-transactions";
import { getBankStatementMapping, saveBankStatementMapping } from "../../services/bank-statement-mappings";

interface Props {
  accounts: BankAccountBalance[];
  onClose: () => void;
  onImported: () => void;
}

const emptyMappingForm = { date: "", description: "", debit: "", credit: "", balance: "", reference: "" };

export default function ImportTransactionsModal({ accounts, onClose, onImported }: Props) {
  const [companyBankAccountId, setCompanyBankAccountId] = useState(accounts[0]?.id ?? "");
  const [parsed, setParsed] = useState<ParsedImportResult | null>(null);
  const [mappingNeeded, setMappingNeeded] = useState<MappingNeededResult | null>(null);
  const [mappingForm, setMappingForm] = useState(emptyMappingForm);
  const [bankNameLabel, setBankNameLabel] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [statementCheck, setStatementCheck] = useState<StatementImportDuplicateCheck | null>(null);
  const [confirmReimport, setConfirmReimport] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const resetOutcome = () => {
    setParsed(null);
    setMappingNeeded(null);
    setMappingForm(emptyMappingForm);
    setBankNameLabel("");
    setStatementCheck(null);
    setConfirmReimport(false);
    setSummary(null);
  };

  // Re-check for an identical previously-imported file whenever the chosen file or bank account changes.
  useEffect(() => {
    if (!fileHash || !companyBankAccountId) {
      setStatementCheck(null);
      return;
    }
    setConfirmReimport(false);
    checkStatementImportDuplicate(companyBankAccountId, fileHash)
      .then(setStatementCheck)
      .catch(() => setStatementCheck(null));
  }, [fileHash, companyBankAccountId]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParsing(true);
    setError(null);
    resetOutcome();
    try {
      const [hash, result] = await Promise.all([computeFileHash(file), parseBankStatementFile(file)]);
      setFileHash(hash);

      if (!result.needsMapping) {
        if (!result.rows.length && result.skipped === 0) {
          throw new Error("No valid transactions found in this file.");
        }
        setParsed(result);
        return;
      }

      // Auto-detection couldn't confidently locate/map the header row. Check whether we've
      // already saved a mapping for this exact header layout before asking the user again.
      const saved = await getBankStatementMapping(result.signature).catch(() => null);
      if (saved) {
        const applied = applyColumnMapping(result.dataRows, {
          dateColumn: saved.dateColumn,
          descriptionColumn: saved.descriptionColumn,
          debitColumn: saved.debitColumn,
          creditColumn: saved.creditColumn,
          balanceColumn: saved.balanceColumn,
          referenceColumn: saved.referenceColumn,
        });
        if (!applied.rows.length) throw new Error("No valid transactions found using the saved column mapping for this bank format.");
        setParsed({ ...applied, signature: result.signature });
        return;
      }

      setMappingNeeded(result);
      const s = result.suggestedMapping;
      setMappingForm({
        date: s.dateColumn >= 0 ? String(s.dateColumn) : "",
        description: s.descriptionColumn != null ? String(s.descriptionColumn) : "",
        debit: s.debitColumn != null ? String(s.debitColumn) : "",
        credit: s.creditColumn != null ? String(s.creditColumn) : "",
        balance: s.balanceColumn != null ? String(s.balanceColumn) : "",
        reference: s.referenceColumn != null ? String(s.referenceColumn) : "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse the file.");
    } finally {
      setParsing(false);
    }
  };

  const handleApplyMapping = async () => {
    if (!mappingNeeded) return;
    setError(null);
    try {
      if (!mappingForm.date) throw new Error("Date column is required.");
      if (!mappingForm.debit && !mappingForm.credit) throw new Error("Map at least a Debit or Credit column.");

      const mapping: ColumnMapping = {
        dateColumn: Number(mappingForm.date),
        descriptionColumn: mappingForm.description !== "" ? Number(mappingForm.description) : null,
        debitColumn: mappingForm.debit !== "" ? Number(mappingForm.debit) : null,
        creditColumn: mappingForm.credit !== "" ? Number(mappingForm.credit) : null,
        balanceColumn: mappingForm.balance !== "" ? Number(mappingForm.balance) : null,
        referenceColumn: mappingForm.reference !== "" ? Number(mappingForm.reference) : null,
      };

      const applied = applyColumnMapping(mappingNeeded.dataRows, mapping);
      if (!applied.rows.length) throw new Error("No valid transactions found with this column mapping. Check your selections.");

      await saveBankStatementMapping({
        signature: mappingNeeded.signature,
        bankName: bankNameLabel.trim() || undefined,
        dateColumn: mapping.dateColumn,
        descriptionColumn: mapping.descriptionColumn,
        debitColumn: mapping.debitColumn,
        creditColumn: mapping.creditColumn,
        balanceColumn: mapping.balanceColumn,
        referenceColumn: mapping.referenceColumn,
      });

      setParsed({ ...applied, signature: mappingNeeded.signature });
      setMappingNeeded(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply column mapping.");
    }
  };

  const needsReimportConfirmation = statementCheck?.duplicate && !confirmReimport;

  const handleImport = async () => {
    if (!parsed || !companyBankAccountId || needsReimportConfirmation) return;
    setImporting(true);
    setError(null);
    try {
      const result = await importBankTransactions(companyBankAccountId, parsed.rows, fileHash, fileName);
      setSummary(result);
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

        {summary ? (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-800">Import Summary</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-200 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{summary.totalFound}</p>
                <p className="text-xs text-slate-500">Transactions Found</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700">{summary.imported}</p>
                <p className="text-xs text-emerald-700">Imported</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
                <p className="text-2xl font-bold text-amber-700">{summary.skippedDuplicates}</p>
                <p className="text-xs text-amber-700">Skipped (Duplicates)</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">0</p>
                <p className="text-xs text-slate-500">Errors</p>
              </div>
            </div>
            {summary.imported === 0 && summary.skippedDuplicates > 0 && (
              <p className="text-sm text-slate-500">Every transaction in this file was already on file for this account — nothing new was imported.</p>
            )}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onImported}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Bank Account *</label>
            <select value={companyBankAccountId} onChange={(e) => setCompanyBankAccountId(e.target.value)} className="w-full rounded-lg border p-2.5">
              <option value="">Select account</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.nickname || a.bankName} — {a.accountNumber}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Statement File (.xlsx, .xls or .csv) *</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-6 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600">
              <Upload className="h-5 w-5" />
              {fileName || "Click to choose a file"}
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
            </label>
            <p className="mt-1 text-xs text-slate-400">
              Works with real HDFC, Bank of Maharashtra, SBI, ICICI, Axis, BOB, Union, Canara, IDBI, Kotak, Yes Bank and
              PNB exports — the header row is found automatically even with account details above it.
            </p>
          </div>

          {parsing && <p className="text-sm text-slate-500">Parsing file...</p>}

          {statementCheck?.duplicate && statementCheck.existingImport && (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold">This exact file was already imported.</p>
                  <p className="mt-1">
                    Imported on {statementCheck.existingImport.importedAt.slice(0, 10)} by {statementCheck.existingImport.importedBy}
                    {" — "}{statementCheck.existingImport.importedRows} of {statementCheck.existingImport.totalRows} transaction
                    {statementCheck.existingImport.totalRows === 1 ? "" : "s"} imported
                    {statementCheck.existingImport.periodFrom && (
                      <> (period {statementCheck.existingImport.periodFrom} to {statementCheck.existingImport.periodTo})</>
                    )}
                    .
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-red-800">
                <input type="checkbox" checked={confirmReimport} onChange={(e) => setConfirmReimport(e.target.checked)} />
                Import anyway (duplicate transactions will still be automatically skipped)
              </label>
            </div>
          )}

          {mappingNeeded && (
            <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                Couldn&apos;t automatically map every column for this file&apos;s header row (row {mappingNeeded.headerRowIndex + 1}).
                Map the columns below — this mapping will be remembered for the next file in this same format.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {MAPPABLE_FIELD_KEYS.map((field) => (
                  <div key={field}>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      {FIELD_LABELS[field]}{field === "date" ? " *" : ""}
                    </label>
                    <select
                      value={mappingForm[field]}
                      onChange={(e) => setMappingForm({ ...mappingForm, [field]: e.target.value })}
                      className="w-full rounded-lg border p-2 text-sm"
                    >
                      <option value="">{field === "date" ? "Select column" : "None"}</option>
                      {mappingNeeded.headers.map((h, i) => (
                        <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Bank Name (optional, for your reference)</label>
                <input
                  value={bankNameLabel}
                  onChange={(e) => setBankNameLabel(e.target.value)}
                  placeholder="e.g. HDFC Bank Savings"
                  className="w-full rounded-lg border p-2 text-sm"
                />
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={handleApplyMapping} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
                  Apply Mapping &amp; Preview
                </button>
              </div>
            </div>
          )}

          {parsed && (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                Found <span className="font-semibold">{parsed.rows.length}</span> transaction{parsed.rows.length === 1 ? "" : "s"} to import
                {parsed.skipped > 0 && <span className="text-amber-600"> ({parsed.skipped} row{parsed.skipped === 1 ? "" : "s"} skipped — missing date or amount)</span>}.
                {" "}Duplicate transactions already on file will be skipped automatically.
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
                      <th className="px-3 py-2 text-right">Balance</th>
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
                        <td className="px-3 py-2 text-right">{r.balance !== undefined ? `₹${r.balance.toLocaleString("en-IN")}` : "—"}</td>
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
              disabled={!parsed || !companyBankAccountId || importing || needsReimportConfirmation}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60"
              title={needsReimportConfirmation ? "Confirm you want to re-import this file first" : undefined}
            >
              {importing ? "Importing..." : `Import ${parsed ? parsed.rows.length : ""} Transactions`}
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
