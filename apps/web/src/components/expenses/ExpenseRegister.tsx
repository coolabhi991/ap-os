import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Register from "../register/Register";
import type { RegisterColumn, RegisterEditorProps } from "../register/types";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getSiteExpenseSummary,
  isMachineryCategory,
  PAYMENT_MODE_OPTIONS,
  PAYMENT_MODE_LABELS,
} from "../../services/expenses";
import type { Expense, SiteExpenseSummary } from "../../services/expenses";
import { getExpenseCategories } from "../../services/expense-categories";
import type { ExpenseCategory } from "../../services/expense-categories";
import { getVendors } from "../../services/vendors";
import type { Vendor } from "../../services/vendors";
import { getCompanyBankAccounts } from "../../services/company-bank-accounts";
import type { CompanyBankAccount } from "../../services/company-bank-accounts";
import { getLiabilities } from "../../services/liabilities";
import type { Liability } from "../../services/liabilities";
import type { Site } from "../../services/sites";
import { formatCurrency as inr, todayISO } from "../../lib/utils";
import LoadingState from "../ui/LoadingState";

// Site Workspace -> Expenses tab is the only entry point (Register Component milestone) — Project
// and Site are already known here and must never be asked for again.

interface Row {
  id?: string;
  expenseDate: string;
  categoryId: string;
  categoryName?: string;
  description: string;
  vendorId: string;
  vendorName?: string;
  amount: number;
  paymentMode: string;
  companyBankAccountId: string;
  liabilityId: string;
  remarks: string;
  attachmentFileName: string;
  // Carried along for the create/update payload, not shown as Register columns.
  projectId: string;
  siteId: string;
  subWorkId: string;
  attachmentFileUrl: string;
  machineType: string;
  machineHours: number;
  machineRatePerHour: number;
}

function toRow(e: Expense): Row {
  return {
    id: e.id,
    expenseDate: e.expenseDate,
    categoryId: e.categoryId,
    categoryName: e.category?.name,
    description: e.description,
    vendorId: e.vendorId,
    vendorName: e.vendor?.name,
    amount: Number(e.amount),
    paymentMode: e.paymentMode,
    companyBankAccountId: e.companyBankAccountId,
    liabilityId: e.liabilityId,
    remarks: e.remarks,
    attachmentFileName: e.attachmentFileName,
    projectId: e.projectId,
    siteId: e.siteId,
    subWorkId: e.subWorkId,
    attachmentFileUrl: e.attachmentFileUrl,
    machineType: e.machineType,
    machineHours: Number(e.machineHours || 0),
    machineRatePerHour: Number(e.machineRatePerHour || 0),
  };
}

export default function ExpenseRegister({ site }: { site: Site }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [companyAccounts, setCompanyAccounts] = useState<CompanyBankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<Liability[]>([]);
  // Source Account Workflow — the same Company Bank Accounts Master doubles as the Cash Account
  // Master (it already supports named Cash-type rows, e.g. "Company Cash", "Site Petty Cash").
  const bankAccounts = companyAccounts.filter((a) => a.accountType === "BANK");
  const cashAccounts = companyAccounts.filter((a) => a.accountType === "CASH");
  const [summary, setSummary] = useState<SiteExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRows = () =>
    getExpenses({ siteId: site.id, page: 1, limit: 100, sortBy: "expenseDate", sortOrder: "desc" }).then((res) => setRows(res.data.map(toRow)));

  const loadSummary = () => getSiteExpenseSummary(site.id).then(setSummary).catch(() => {});

  useEffect(() => {
    Promise.all([
      loadRows(),
      loadSummary(),
      getExpenseCategories(false, "SITE_EXPENSE").then(setCategories),
      getVendors({ limit: 100 }).then((r) => setVendors(r.data)),
      getCompanyBankAccounts().then((accounts) => setCompanyAccounts(accounts.filter((a) => a.isActive))),
      getLiabilities({ liabilityType: "CREDIT_CARD" }).then((r) => setCreditCards(r.data)),
    ])
      .catch(() => setError("Failed to load the Expense Register."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site.id]);

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const vendorOptions = vendors.map((v) => ({ value: v.id, label: v.name }));
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const emptyRow = (): Row => ({
    expenseDate: todayISO(),
    categoryId: "",
    description: "",
    vendorId: "",
    amount: 0,
    paymentMode: "",
    companyBankAccountId: "",
    liabilityId: "",
    remarks: "",
    attachmentFileName: "",
    projectId: site.projectId,
    siteId: site.id,
    subWorkId: "",
    attachmentFileUrl: "",
    machineType: "",
    machineHours: 0,
    machineRatePerHour: 0,
  });

  const toFormData = (row: Row) => ({
    projectId: site.projectId,
    siteId: site.id,
    categoryId: row.categoryId,
    vendorId: row.vendorId,
    subWorkId: row.subWorkId || "",
    expenseDate: row.expenseDate,
    description: row.description,
    amount: row.amount,
    paymentMode: row.paymentMode,
    companyBankAccountId: row.companyBankAccountId,
    liabilityId: row.liabilityId,
    attachmentFileName: row.attachmentFileName,
    attachmentFileUrl: row.attachmentFileUrl,
    remarks: row.remarks,
    machineType: row.machineType,
    machineHours: row.machineHours,
    machineRatePerHour: row.machineRatePerHour,
  });

  const handleSaveRow = async (row: Row): Promise<Row> => {
    const created = await createExpense(toFormData(row));
    loadSummary();
    return toRow(created);
  };

  const handleUpdateRow = async (id: string, row: Row): Promise<Row> => {
    const updated = await updateExpense(id, toFormData(row));
    loadSummary();
    return toRow(updated);
  };

  const handleDeleteRow = async (id: string): Promise<void> => {
    await deleteExpense(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
    loadSummary();
  };

  const validateRow = (row: Row): string | null => {
    if (!row.categoryId) return "Category is required.";
    if (!row.paymentMode) return "Payment mode is required.";
    if (row.paymentMode === "CASH" && !row.companyBankAccountId) return "Select the Source Account.";
    if (row.paymentMode === "COMPANY_BANK" && !row.companyBankAccountId) return "Select the Source Account.";
    if (row.paymentMode === "CREDIT_CARD" && !row.liabilityId) return "Select the Source Account.";
    if (row.paymentMode === "VENDOR_CREDIT" && !row.vendorId) return "Vendor is required for Vendor Credit.";
    if (!row.amount || row.amount <= 0) return "Enter an amount greater than zero.";
    return null;
  };

  const disableRowReason = (row: Row): string | null => {
    const name = categoryNameById.get(row.categoryId);
    if (isMachineryCategory(name)) {
      return "Machinery expenses are entered via hours × rate — use the full Add Expense form for this row.";
    }
    return null;
  };

  const inputClass = "w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  const paymentModeEditor = ({ row, value, onChange, onRowChange, autoFocus }: RegisterEditorProps<Row>) => (
    <div className="space-y-1">
      <select
        autoFocus={autoFocus}
        data-col-index={5}
        className={inputClass}
        value={String(value ?? "")}
        onChange={(e) => {
          // Switching Payment Mode clears whichever Source Account field no longer applies —
          // CASH/COMPANY_BANK both use companyBankAccountId (filtered by accountType at render
          // time below), CREDIT_CARD uses liabilityId.
          const next = e.target.value;
          const clearBank = next !== "CASH" && next !== "COMPANY_BANK" && row.companyBankAccountId;
          const clearCard = next !== "CREDIT_CARD" && row.liabilityId;
          if (clearBank || clearCard) {
            onRowChange({
              paymentMode: next,
              ...(clearBank && { companyBankAccountId: "" }),
              ...(clearCard && { liabilityId: "" }),
            } as Partial<Row>);
          } else {
            onChange(next);
          }
        }}
      >
        <option value="">Select Mode</option>
        {PAYMENT_MODE_OPTIONS.map((m) => (
          <option key={m} value={m}>{PAYMENT_MODE_LABELS[m]}</option>
        ))}
      </select>
      {row.paymentMode === "CASH" && (
        <select
          className={inputClass}
          value={row.companyBankAccountId}
          onChange={(e) => onRowChange({ companyBankAccountId: e.target.value } as Partial<Row>)}
        >
          <option value="">Select Source Account</option>
          {cashAccounts.map((a) => (
            <option key={a.id} value={a.id}>{a.nickname || "Cash"}</option>
          ))}
        </select>
      )}
      {row.paymentMode === "COMPANY_BANK" && (
        <select
          className={inputClass}
          value={row.companyBankAccountId}
          onChange={(e) => onRowChange({ companyBankAccountId: e.target.value } as Partial<Row>)}
        >
          <option value="">Select Source Account</option>
          {bankAccounts.map((a) => (
            <option key={a.id} value={a.id}>{a.nickname || a.bankName} (••••{a.accountNumber.slice(-4)})</option>
          ))}
        </select>
      )}
      {row.paymentMode === "CREDIT_CARD" && (
        <select
          className={inputClass}
          value={row.liabilityId}
          onChange={(e) => onRowChange({ liabilityId: e.target.value } as Partial<Row>)}
        >
          <option value="">Select Source Account</option>
          {creditCards.map((c) => (
            <option key={c.id} value={c.id}>{c.loanName}{c.accountNumber ? ` (••••${c.accountNumber.slice(-4)})` : ""}</option>
          ))}
        </select>
      )}
    </div>
  );

  const columns: RegisterColumn<Row>[] = [
    { key: "expenseDate", label: "Date", type: "date", width: "w-36", searchable: false },
    { key: "categoryId", label: "Category", type: "select", options: categoryOptions, width: "w-40", rememberInSession: true, filterable: true, render: (_v, row) => row.categoryName || "—" },
    { key: "description", label: "Description", type: "text", searchable: true },
    { key: "vendorId", label: "Vendor", type: "select", options: vendorOptions, width: "w-40", rememberInSession: true, render: (_v, row) => row.vendorName || "—" },
    { key: "amount", label: "Amount", type: "number", width: "w-28", align: "right", render: (v) => inr(Number(v)) },
    { key: "paymentMode", label: "Payment Mode", type: "select", options: PAYMENT_MODE_OPTIONS.map((m) => ({ value: m, label: PAYMENT_MODE_LABELS[m] })), width: "w-40", rememberInSession: true, filterable: true, renderEditor: paymentModeEditor, render: (v) => PAYMENT_MODE_LABELS[String(v)] ?? "—" },
    { key: "remarks", label: "Remarks", type: "text" },
    { key: "attachmentFileName", label: "Attachment", type: "text", placeholder: "file name (optional)" },
  ];

  if (loading) return <LoadingState label="Loading Expense Register..." />;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Expense Register</h2>
          <p className="text-sm text-slate-500">
            Site: <strong>{site.name}</strong> — entries are recorded directly against this site.
          </p>
        </div>
        <button
          onClick={() => navigate(`/expenses/new?projectId=${site.projectId}&siteId=${site.id}&siteName=${encodeURIComponent(site.name)}`)}
          className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          title="Use the full form for edge cases like Machinery (hours x rate)"
        >
          Full Form (Machinery, etc.)
        </button>
      </div>

      <Register<Row>
        columns={columns}
        rows={rows}
        emptyRow={emptyRow}
        onSaveRow={async (row) => {
          const saved = await handleSaveRow(row);
          setRows((prev) => [saved, ...prev]);
          return saved;
        }}
        onUpdateRow={async (id, row) => {
          const saved = await handleUpdateRow(id, row);
          setRows((prev) => prev.map((r) => (r.id === id ? saved : r)));
          return saved;
        }}
        onDeleteRow={handleDeleteRow}
        validateRow={validateRow}
        disableRowReason={disableRowReason}
        searchPlaceholder="Search description, remarks..."
        emptyMessage='No expenses recorded for this site yet. Click "Add Row" to start.'
        summary={
          summary && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">Today's Total</p>
                <p className="mt-1 text-lg font-bold">{inr(summary.today.amount)}</p>
                <p className="text-[11px] text-slate-400">{summary.today.count} entr{summary.today.count === 1 ? "y" : "ies"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">This Month's Total</p>
                <p className="mt-1 text-lg font-bold">{inr(summary.thisMonth.amount)}</p>
                <p className="text-[11px] text-slate-400">{summary.thisMonth.count} entries</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">Site Total</p>
                <p className="mt-1 text-lg font-bold">{inr(summary.site.amount)}</p>
                <p className="text-[11px] text-slate-400">{summary.site.count} entries all-time</p>
              </div>
            </div>
          )
        }
      />
    </div>
  );
}
