import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import PaymentForm from "../../components/labour/PaymentForm";
import { createLabourPayment } from "../../services/labour-payments";
import type { LabourPaymentFormData } from "../../services/labour-payments";
import { getLabourList } from "../../services/labour";
import { getProjects } from "../../services/projects";
import { getCompanyBankAccounts } from "../../services/company-bank-accounts";
import type { CompanyBankAccount } from "../../services/company-bank-accounts";

export default function AddPayment() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labourers, setLabourers] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [companyBankAccounts, setCompanyBankAccounts] = useState<CompanyBankAccount[]>([]);

  useEffect(() => {
    getLabourList({ status: "Active", limit: 200 }).then((r) => setLabourers(r.data)).catch(() => {});
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getCompanyBankAccounts().then((accounts) => setCompanyBankAccounts(accounts.filter((a) => a.isActive))).catch(() => {});
  }, []);

  const handleSubmit = async (data: LabourPaymentFormData) => {
    try {
      setSaving(true);
      setError(null);
      await createLabourPayment(data);
      navigate("/labour/payments");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Record Payment</h1>
          <p className="mt-2 text-slate-500">Settle wages owed to a worker.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        <PaymentForm onSubmit={handleSubmit} saving={saving} labourers={labourers} projects={projects} companyBankAccounts={companyBankAccounts} />
      </div>
    </Layout>
  );
}
