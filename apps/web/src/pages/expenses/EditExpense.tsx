import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import ExpenseForm from "../../components/expenses/ExpenseForm";
import { getExpense, updateExpense } from "../../services/expenses";
import type { ExpenseFormData } from "../../services/expenses";
import { getExpenseCategories } from "../../services/expense-categories";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";
import { getCompanyBankAccounts } from "../../services/company-bank-accounts";
import type { CompanyBankAccount } from "../../services/company-bank-accounts";
import { getLiabilities } from "../../services/liabilities";
import type { Liability } from "../../services/liabilities";

export default function EditExpense() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<Partial<ExpenseFormData> | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [companyBankAccounts, setCompanyBankAccounts] = useState<CompanyBankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<Liability[]>([]);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getVendors({ limit: 100 }).then((r) => setVendors(r.data)).catch(() => {});
    getExpenseCategories(false).then(setCategories).catch(() => {});
    getCompanyBankAccounts().then((accounts) => setCompanyBankAccounts(accounts.filter((a) => a.isActive))).catch(() => {});
    getLiabilities({ liabilityType: "CREDIT_CARD" }).then((r) => setCreditCards(r.data)).catch(() => {});

    if (!id) return;
    getExpense(id)
      .then((e) => {
        setInitialData({
          projectId: e.projectId,
          categoryId: e.categoryId,
          vendorId: e.vendorId,
          expenseDate: e.expenseDate,
          description: e.description,
          amount: Number(e.amount),
          paymentMode: e.paymentMode,
          companyBankAccountId: e.companyBankAccountId,
          liabilityId: e.liabilityId,
          attachmentFileName: e.attachmentFileName,
          attachmentFileUrl: e.attachmentFileUrl,
          remarks: e.remarks,
        });
      })
      .catch(() => setError("Failed to load expense."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: ExpenseFormData) => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      await updateExpense(id, data);
      navigate("/expenses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update expense.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Expense</h1>
          <p className="mt-2 text-slate-500">Update expense details.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div>
        ) : (
          <ExpenseForm
            initialData={initialData}
            onSubmit={handleSubmit}
            saving={saving}
            projects={projects}
            vendors={vendors}
            categories={categories}
            companyBankAccounts={companyBankAccounts}
            creditCards={creditCards}
          />
        )}
      </div>
    </Layout>
  );
}
