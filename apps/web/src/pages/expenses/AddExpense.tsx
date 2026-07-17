import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import ExpenseForm from "../../components/expenses/ExpenseForm";
import { createExpense } from "../../services/expenses";
import type { ExpenseFormData } from "../../services/expenses";
import { getExpenseCategories } from "../../services/expense-categories";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";
import { getCompanyBankAccounts } from "../../services/company-bank-accounts";
import type { CompanyBankAccount } from "../../services/company-bank-accounts";
import { getLiabilities } from "../../services/liabilities";
import type { Liability } from "../../services/liabilities";

export default function AddExpense() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lockedProjectId = searchParams.get("projectId") || undefined;
  const lockedSiteId = searchParams.get("siteId") || undefined;
  const lockedSiteName = searchParams.get("siteName") || undefined;

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
    getExpenseCategories(false, "SITE_EXPENSE").then(setCategories).catch(() => {});
    getCompanyBankAccounts().then((accounts) => setCompanyBankAccounts(accounts.filter((a) => a.isActive))).catch(() => {});
    getLiabilities({ liabilityType: "CREDIT_CARD" }).then((r) => setCreditCards(r.data)).catch(() => {});
  }, []);

  const lockedProjectName = projects.find((p) => p.id === lockedProjectId)?.name;

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
          creditCards={creditCards}
          lockedProjectId={lockedProjectId}
          lockedProjectName={lockedProjectName}
          lockedSiteId={lockedSiteId}
          lockedSiteName={lockedSiteName}
        />
      </div>
    </Layout>
  );
}
