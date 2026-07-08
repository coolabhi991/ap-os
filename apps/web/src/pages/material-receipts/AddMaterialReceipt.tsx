import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import MaterialReceiptForm from "../../components/material-receipts/MaterialReceiptForm";
import { createMaterialReceipt, getReceivablePOs } from "../../services/material-receipts";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";
import type { MRFormData, ReceivablePO } from "../../services/material-receipts";

export default function AddMaterialReceipt() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receivablePOs, setReceivablePOs] = useState<ReceivablePO[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getReceivablePOs().then(setReceivablePOs).catch(() => {});
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getVendors({ limit: 100 }).then((r) => setVendors(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (data: MRFormData) => {
    try {
      setSaving(true);
      setError(null);
      await createMaterialReceipt(data);
      navigate("/material-receipts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create material receipt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">New Material Receipt</h1>
          <p className="mt-2 text-slate-500">Record materials received against an issued purchase order.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
        <MaterialReceiptForm
          onSubmit={handleSubmit}
          saving={saving}
          receivablePOs={receivablePOs}
          projects={projects}
          vendors={vendors}
        />
      </div>
    </Layout>
  );
}
