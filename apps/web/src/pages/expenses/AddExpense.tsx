import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import ExpenseForm from "../../components/expenses/ExpenseForm";
import { createExpense } from "../../services/expenses";
import type { ExpenseFormData } from "../../services/expenses";
import { getExpenseCategories } from "../../services/expense-categories";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";
import { getCompanyBankAccounts } from "../../services/company-bank-accounts";
import type { CompanyBankAccount } from "../../services/company-bank-accounts";

export default function AddExpense() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [companyBankAccounts, setCompanyBankAccounts] = useState<CompanyBankAccount[]>([]);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getVendors({ limit: 100 }).then((r) => setVendors(r.data)).catch(() => {});
    getExpenseCategories(false).then(setCategories).catch(() => {});
    getCompanyBankAccounts().then((accounts) => setCompanyBankAccounts(accounts.filter((a) => a.isActive))).catch(() => {});
  }, []);

  const handleSubmit = async (data: ExpenseFormData) => {
    try {
      setSaving(true);
      setError(null);
      await createExpense(data);
      navigate("/expenses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create expense.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">New Expense</h1>
          <p className="mt-2 text-slate-500">Record a site expense against a project.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        <ExpenseForm
          onSubmit={handleSubmit}
          saving={saving}
          projects={projects}
          vendors={vendors}
          categories={categories}
          companyBankAccounts={companyBankAccounts}
        />
      </div>
    </Layout>
  );
}
