import * as XLSX from "xlsx";
import type { ImportRow } from "../services/bank-transactions";

export type FieldKey = "date" | "description" | "debit" | "credit" | "balance" | "reference" | "category";

export const MAPPABLE_FIELD_KEYS: Exclude<FieldKey, "category">[] = [
  "date",
  "description",
  "debit",
  "credit",
  "balance",
  "reference",
];

export const FIELD_LABELS: Record<Exclude<FieldKey, "category">, string> = {
  date: "Date",
  description: "Description",
  debit: "Debit",
  credit: "Credit",
  balance: "Balance",
  reference: "Reference",
};

/**
 * Header text variations seen across real Indian bank statement exports (HDFC, Bank of
 * Maharashtra, SBI, ICICI, Axis, Bank of Baroda, Union Bank, Canara Bank, IDBI, Kotak, Yes Bank,
 * PNB, ...). Matching is fuzzy (whole-word substring, punctuation-insensitive) so minor variants
 * like "Cheque/Reference No" or "Value Dt." still resolve to the right canonical field.
 */
const HEADER_ALIASES: Record<FieldKey, string[]> = {
  date: ["date", "txn date", "transaction date", "value date", "posting date", "tran date", "value dt"],
  description: ["narration", "particulars", "description", "details", "remarks", "transaction remarks"],
  debit: ["debit", "withdrawal", "withdrawal amt", "withdrawal amount", "debit amount", "amount debited", "dr", "outflow"],
  credit: ["credit", "deposit", "deposit amt", "deposit amount", "credit amount", "amount credited", "cr", "inflow"],
  balance: ["balance", "closing balance", "running balance", "available balance"],
  reference: [
    "chq/ref no",
    "cheque/reference no",
    "reference no",
    "reference number",
    "ref no",
    "cheque no",
    "cheque number",
    "chq no",
    "instrument id",
    "instrument no",
    "utr",
    "transaction id",
  ],
  category: ["category", "type"],
};

const MAX_HEADER_SCAN_ROWS = 50;

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesAlias(normalized: string, aliases: string[]): boolean {
  if (!normalized) return false;
  return aliases.some((alias) => normalized === alias || new RegExp(`\\b${escapeRegex(alias)}\\b`).test(normalized));
}

function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

export interface HeaderCandidate {
  rowIndex: number;
  headers: string[];
  fieldCols: Partial<Record<FieldKey, number>>;
}

/** Scans the first 50 rows for the one that looks like the real transaction header row. */
function findHeaderCandidate(rows: unknown[][]): { candidate: HeaderCandidate; confident: boolean } | null {
  const scanLimit = Math.min(rows.length, MAX_HEADER_SCAN_ROWS);
  let best: HeaderCandidate | null = null;
  let bestScore = -1;

  for (let i = 0; i < scanLimit; i++) {
    const row = rows[i] ?? [];
    const headers = row.map((c) => String(c ?? "").trim());
    const fieldCols: Partial<Record<FieldKey, number>> = {};

    for (let col = 0; col < headers.length; col++) {
      const normalized = normalizeHeader(headers[col]);
      if (!normalized) continue;
      for (const field of Object.keys(HEADER_ALIASES) as FieldKey[]) {
        if (fieldCols[field] !== undefined) continue;
        if (matchesAlias(normalized, HEADER_ALIASES[field])) {
          fieldCols[field] = col;
        }
      }
    }

    const score = Object.keys(fieldCols).length;
    const confident = fieldCols.date !== undefined && (fieldCols.debit !== undefined || fieldCols.credit !== undefined);

    if (confident) {
      return { candidate: { rowIndex: i, headers, fieldCols }, confident: true };
    }
    if (score > bestScore) {
      bestScore = score;
      best = { rowIndex: i, headers, fieldCols };
    }
  }

  if (!best) return null;
  return { candidate: best, confident: false };
}

/** Stable identifier for a header layout — same bank/account export always reduces to the same signature. */
export function computeHeaderSignature(headers: string[]): string {
  return headers.map(normalizeHeader).filter(Boolean).join("|");
}

export interface ColumnMapping {
  dateColumn: number;
  descriptionColumn?: number | null;
  debitColumn?: number | null;
  creditColumn?: number | null;
  balanceColumn?: number | null;
  referenceColumn?: number | null;
  categoryColumn?: number | null;
}

export interface ParsedRow extends ImportRow {
  balance?: number;
}

export interface ParsedImportResult {
  needsMapping: false;
  rows: ParsedRow[];
  skipped: number;
  signature: string;
  detectedHeaders: Partial<Record<FieldKey, string>>;
}

export interface MappingNeededResult {
  needsMapping: true;
  signature: string;
  headers: string[];
  headerRowIndex: number;
  dataRows: unknown[][];
  /** Best-guess mapping from what little the scan did recognize — pre-fills the manual mapping screen. */
  suggestedMapping: ColumnMapping;
}

export type ParseOutcome = ParsedImportResult | MappingNeededResult;

function buildRows(dataRows: unknown[][], mapping: ColumnMapping): { rows: ParsedRow[]; skipped: number } {
  let skipped = 0;
  const rows: ParsedRow[] = [];

  for (const row of dataRows) {
    if (!row || row.every((c) => String(c ?? "").trim() === "")) continue;

    const transactionDate = toDateString(row[mapping.dateColumn]);
    const deposit = mapping.creditColumn != null ? toNumber(row[mapping.creditColumn]) : 0;
    const withdrawal = mapping.debitColumn != null ? toNumber(row[mapping.debitColumn]) : 0;

    if (!transactionDate || (deposit <= 0 && withdrawal <= 0)) {
      skipped++;
      continue;
    }

    const balanceRaw = mapping.balanceColumn != null ? row[mapping.balanceColumn] : undefined;

    rows.push({
      transactionDate,
      deposit: deposit > 0 ? deposit : undefined,
      withdrawal: withdrawal > 0 ? withdrawal : undefined,
      referenceNumber: mapping.referenceColumn != null ? cleanText(row[mapping.referenceColumn]) || undefined : undefined,
      description: mapping.descriptionColumn != null ? cleanText(row[mapping.descriptionColumn]) || undefined : undefined,
      category: mapping.categoryColumn != null ? cleanText(row[mapping.categoryColumn]) || undefined : undefined,
      balance: balanceRaw !== undefined ? toNumber(balanceRaw) : undefined,
    });
  }

  return { rows, skipped };
}

function candidateToMapping(candidate: HeaderCandidate): ColumnMapping {
  return {
    dateColumn: candidate.fieldCols.date ?? -1,
    descriptionColumn: candidate.fieldCols.description,
    debitColumn: candidate.fieldCols.debit,
    creditColumn: candidate.fieldCols.credit,
    balanceColumn: candidate.fieldCols.balance,
    referenceColumn: candidate.fieldCols.reference,
    categoryColumn: candidate.fieldCols.category,
  };
}

/** SHA-256 of the raw file bytes — the "File Fingerprint" used to detect re-uploading the exact same statement export. */
export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function readWorkbookRows(file: File): Promise<unknown[][]> {
  const isCsv = file.name.toLowerCase().endsWith(".csv");
  const workbook = isCsv
    ? XLSX.read(await file.text(), { type: "string" })
    : XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
}

/**
 * Parses an Excel (.xls/.xlsx) or CSV bank statement file entirely client-side. Real Indian bank
 * exports place account/branch/address/statement-period preamble rows before the actual
 * transaction table, so this scans the first 50 rows to locate the real header row instead of
 * assuming row 0 is it, then ignores everything above that row.
 */
export async function parseBankStatementFile(file: File): Promise<ParseOutcome> {
  const allRows = await readWorkbookRows(file);
  if (!allRows.length) {
    return { needsMapping: false, rows: [], skipped: 0, signature: "", detectedHeaders: {} };
  }

  const found = findHeaderCandidate(allRows);
  if (!found) {
    return { needsMapping: false, rows: [], skipped: 0, signature: "", detectedHeaders: {} };
  }

  const { candidate, confident } = found;
  const signature = computeHeaderSignature(candidate.headers);
  const dataRows = allRows.slice(candidate.rowIndex + 1);
  const mapping = candidateToMapping(candidate);

  if (!confident || mapping.dateColumn < 0) {
    return {
      needsMapping: true,
      signature,
      headers: candidate.headers,
      headerRowIndex: candidate.rowIndex,
      dataRows,
      suggestedMapping: mapping,
    };
  }

  const { rows, skipped } = buildRows(dataRows, mapping);
  const detectedHeaders: Partial<Record<FieldKey, string>> = {};
  for (const field of Object.keys(HEADER_ALIASES) as FieldKey[]) {
    const col = candidate.fieldCols[field];
    if (col !== undefined) detectedHeaders[field] = candidate.headers[col];
  }

  return { needsMapping: false, rows, skipped, signature, detectedHeaders };
}

/** Applies an explicit (saved or manually chosen) column mapping to already-extracted raw data rows. */
export function applyColumnMapping(dataRows: unknown[][], mapping: ColumnMapping): ParsedImportResult {
  const signature = ""; // caller already knows the signature from the MappingNeededResult it came from
  const { rows, skipped } = buildRows(dataRows, mapping);
  return { needsMapping: false, rows, skipped, signature, detectedHeaders: {} };
}
