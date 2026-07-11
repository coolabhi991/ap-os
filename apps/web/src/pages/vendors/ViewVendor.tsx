import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import VendorOverviewTab from "../../components/vendors/tabs/VendorOverviewTab";
import VendorProjectsTab from "../../components/vendors/tabs/VendorProjectsTab";
import VendorBillsTab from "../../components/vendors/tabs/VendorBillsTab";
import VendorPaymentsTab from "../../components/vendors/tabs/VendorPaymentsTab";
import VendorDocumentsTab from "../../components/vendors/tabs/VendorDocumentsTab";
import VendorLedgerTab from "../../components/vendors/tabs/VendorLedgerTab";
import { getVendor } from "../../services/vendors";
import type { Vendor } from "../../services/vendors";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "projects", label: "Projects" },
  { key: "bills", label: "Bills" },
  { key: "payments", label: "Payments" },
  { key: "outstanding", label: "Outstanding" },
  { key: "documents", label: "Documents" },
  { key: "ledger", label: "Ledger" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function ViewVendor() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");

  useEffect(() => {
    if (!id) return;
    getVendor(id)
      .then(setVendor)
      .catch(() => setError("Vendor not found or failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">
          Loading vendor...
        </div>
      </Layout>
    );
  }

  if (error || !vendor) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Vendor Not Found</h1>
          <p className="mt-2 text-slate-500">{error ?? "This vendor does not exist."}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{vendor.name}</h1>
          <p className="mt-2 text-slate-500">{vendor.category || "Vendor"} — the complete Vendor Ledger.</p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-xl bg-white p-2 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t.key ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <VendorOverviewTab vendor={vendor} />}
        {tab === "projects" && <VendorProjectsTab vendorId={vendor.id} />}
        {tab === "bills" && <VendorBillsTab vendorId={vendor.id} />}
        {tab === "payments" && <VendorPaymentsTab vendorId={vendor.id} />}
        {tab === "outstanding" && <VendorBillsTab vendorId={vendor.id} onlyOutstanding />}
        {tab === "documents" && <VendorDocumentsTab vendorId={vendor.id} />}
        {tab === "ledger" && <VendorLedgerTab vendorId={vendor.id} />}
      </div>
    </Layout>
  );
}
