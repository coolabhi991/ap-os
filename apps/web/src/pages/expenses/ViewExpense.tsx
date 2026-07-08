import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import { getExpense, PAYMENT_MODE_LABELS, PAYMENT_MODE_COLORS } from "../../services/expenses";
import type { Expense } from "../../services/expenses";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-semibold">{value || "—"}</p>
    </div>
  );
}

export default function ViewExpense() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getExpense(id)
      .then(setExpense)
      .catch(() => setError("Expense not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div></Layout>;
  if (error || !expense) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Expense Not Found</h1>
          <p className="mt-2 text-slate-500">{error}</p>
        </div>
      </Layout>
    );
  }

  const isImageAttachment = /\.(png|jpe?g|gif|webp)$/i.test(expense.attachmentFileName || expense.attachmentFileUrl || "");

  return (
    <Layout>
      <div className="space-y-6">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-sm text-blue-600">{expense.expenseNumber}</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">₹{Number(expense.amount).toLocaleString("en-IN")}</h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                {expense.project && <span>Project: <strong>{expense.project.name}</strong></span>}
                {expense.category && <span>Category: <strong>{expense.category.name}</strong></span>}
                {expense.vendor && <span>Vendor: <strong>{expense.vendor.name}</strong></span>}
                <span>Date: <strong>{expense.expenseDate}</strong></span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-4 py-2 text-sm font-medium ${PAYMENT_MODE_COLORS[expense.paymentMode] ?? "bg-slate-100"}`}>
                {PAYMENT_MODE_LABELS[expense.paymentMode] ?? expense.paymentMode}
              </span>
              <button onClick={() => navigate(`/expenses/${expense.id}/edit`)} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Edit</button>
            </div>
          </div>
          {expense.description && <p className="mt-4 text-slate-600">{expense.description}</p>}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">Payment Information</h2>
            <div className="space-y-4">
              <Row label="Payment Mode" value={PAYMENT_MODE_LABELS[expense.paymentMode] ?? expense.paymentMode} />
              {expense.companyBankAccount && (
                <Row
                  label="Company Bank Account"
                  value={`${expense.companyBankAccount.nickname || expense.companyBankAccount.bankName} — ${expense.companyBankAccount.bankName} (••••${expense.companyBankAccount.accountNumber.slice(-4)})`}
                />
              )}
              {expense.paymentMode === "VENDOR_CREDIT" && (
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                  Recorded as outstanding vendor credit — no payment was created automatically.
                </div>
              )}
              <Row label="Remarks" value={expense.remarks} />
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">Audit Information</h2>
            <div className="space-y-4">
              <Row label="Created By" value={expense.createdBy?.name ?? ""} />
              <Row label="Created At" value={new Date(expense.createdAt).toLocaleString()} />
              <Row label="Last Updated" value={new Date(expense.updatedAt).toLocaleString()} />
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
            <h2 className="mb-5 text-xl font-bold">Attachment</h2>
            {expense.attachmentFileName || expense.attachmentFileUrl ? (
              <div className="space-y-3">
                <Row label="File Name" value={expense.attachmentFileName} />
                {expense.attachmentFileUrl && (
                  <a href={expense.attachmentFileUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                    Open attachment
                  </a>
                )}
                {isImageAttachment && expense.attachmentFileUrl && (
                  <img src={expense.attachmentFileUrl} alt={expense.attachmentFileName} className="mt-3 max-h-64 rounded-lg border" />
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No attachment on file.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
