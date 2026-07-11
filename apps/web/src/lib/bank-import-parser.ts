import * as XLSX from "xlsx";
import type { ImportRow } from "../services/bank-transactions";

/** Common bank-statement header variations, auto-mapped to our canonical fields. */
const HEADER_ALIASES: Record<string, string[]> = {
  date: ["date", "transaction date", "txn date", "value date", "posting date"],
  deposit: ["deposit", "credit", "cr", "credit amount", "amount credited", "inflow"],
  withdrawal: ["withdrawal", "debit", "dr", "debit amount", "amount debited", "outflow"],
  reference: ["reference", "reference no", "reference no.", "ref no", "cheque no", "cheque no.", "utr", "transaction id", "chq/ref no"],
  description: ["description", "narration", "particulars", "details", "remarks"],
  category: ["category", "type"],
};

function normalize(h: string) {
  return h.trim().toLowerCase();
}

function findField(headers: string[], field: string): string | undefined {
  const aliases = HEADER_ALIASES[field];
  return headers.find((h) => aliases.includes(normalize(h)));
}

function toDateString(value: unknown): string {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const str = String(value ?? "").trim();
  if (!str) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const m = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    const [, d, mo, yRaw] = m;
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
    return `${y.padStart(4, "0")}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return "";
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const str = String(value ?? "").replace(/[,₹\s]/g, "");
  const n = Number(str);
  return Number.isFinite(n) ? n : 0;
}

export interface ParsedImportResult {
  rows: ImportRow[];
  skipped: number;
  detectedHeaders: { date?: string; deposit?: string; withdrawal?: string; reference?: string; description?: string; category?: string };
}

/** Parses an Excel (.xlsx) or CSV bank statement file entirely client-side, auto-detecting the column mapping from headers. */
export async function parseBankStatementFile(file: File): Promise<ParsedImportResult> {
  const isCsv = file.name.toLowerCase().endsWith(".csv");
  const workbook = isCsv
    ? XLSX.read(await file.text(), { type: "string" })
    : XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (!records.length) return { rows: [], skipped: 0, detectedHeaders: {} };

  const headers = Object.keys(records[0]);
  const dateKey = findField(headers, "date");
  const depositKey = findField(headers, "deposit");
  const withdrawalKey = findField(headers, "withdrawal");
  const referenceKey = findField(headers, "reference");
  const descriptionKey = findField(headers, "description");
  const categoryKey = findField(headers, "category");

  if (!dateKey || (!depositKey && !withdrawalKey)) {
    throw new Error("Could not detect Date and Deposit/Withdrawal columns. Expected headers like Date, Deposit/Credit, Withdrawal/Debit.");
  }

  let skipped = 0;
  const rows: ImportRow[] = [];
  for (const record of records) {
    const transactionDate = toDateString(record[dateKey]);
    const deposit = depositKey ? toNumber(record[depositKey]) : 0;
    const withdrawal = withdrawalKey ? toNumber(record[withdrawalKey]) : 0;
    if (!transactionDate || (deposit <= 0 && withdrawal <= 0)) {
      skipped++;
      continue;
    }
    rows.push({
      transactionDate,
      deposit: deposit > 0 ? deposit : undefined,
      withdrawal: withdrawal > 0 ? withdrawal : undefined,
      referenceNumber: referenceKey ? String(record[referenceKey] ?? "").trim() || undefined : undefined,
      description: descriptionKey ? String(record[descriptionKey] ?? "").trim() || undefined : undefined,
      category: categoryKey ? String(record[categoryKey] ?? "").trim() || undefined : undefined,
    });
  }

  return {
    rows,
    skipped,
    detectedHeaders: { date: dateKey, deposit: depositKey, withdrawal: withdrawalKey, reference: referenceKey, description: descriptionKey, category: categoryKey },
  };
}
