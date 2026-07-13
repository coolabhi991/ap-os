import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import ClientOverview from "../../components/clients/ClientOverview";
import ReportExportBar from "../../components/ui/ReportExportBar";
import EmptyTableRow from "../../components/ui/EmptyTableRow";
import { getClient, getClientLedger } from "../../services/clients";
import type { Client, ClientLedger } from "../../services/clients";
import { formatCurrency as inr } from "../../lib/utils";

function ClientLedgerPanel({ clientId }: { clientId: string }) {
  const [ledger, setLedger] = useState<ClientLedger | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClientLedger(clientId).then(setLedger).catch(() => setLedger(null)).finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">Loading ledger...</div>;
  if (!ledger) return null;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h2 className="text-xl font-bold">Ledger</h2>
        <ReportExportBar
          input={{
            title: `Client Ledger — ${ledger.clientName}`,
            subtitle: `Total Certified: ${inr(ledger.totalCertified)} | Total Received: ${inr(ledger.totalReceived)} | Outstanding: ${inr(ledger.totalOutstanding)}`,
            columns: [
              { key: "projectName", label: "Project" },
              { key: "agreementValue", label: "Agreement Value", align: "right" },
              { key: "billsCount", label: "Bills", align: "right" },
              { key: "totalCertified", label: "Total Certified", align: "right" },
              { key: "totalReceived", label: "Total Received", align: "right" },
              { key: "outstanding", label: "Outstanding", align: "right" },
            ],
            rows: ledger.projects.map((p) => ({
              projectName: p.projectName,
              agreementValue: p.agreementValue,
              billsCount: p.billsCount,
              totalCertified: p.totalCertified,
              totalReceived: p.totalReceived,
              outstanding: p.outstanding,
            })),
            totals: {
              projectName: "TOTAL",
              totalCertified: ledger.totalCertified,
              totalReceived: ledger.totalReceived,
              outstanding: ledger.totalOutstanding,
            },
          }}
        />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Total Agreement Value</p>
          <p className="mt-1 text-lg font-bold">{inr(ledger.totalAgreementValue)}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Sum of all Site Agreement Values</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Total RA Bills</p>
          <p className="mt-1 text-lg font-bold">{inr(ledger.totalRABills)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Total Client Payments</p>
          <p className="mt-1 text-lg font-bold text-emerald-600">{inr(ledger.totalClientPayments)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Outstanding Amount</p>
          <p className="mt-1 text-lg font-bold text-amber-600">{inr(ledger.outstandingAmount)}</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Project</th>
              <th className="px-4 py-3 text-right">Agreement Value</th>
              <th className="px-4 py-3 text-right">Bills</th>
              <th className="px-4 py-3 text-right">Total Certified</th>
              <th className="px-4 py-3 text-right">Total Received</th>
              <th className="px-4 py-3 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {ledger.projects.length === 0 ? (
              <EmptyTableRow colSpan={6}>No projects for this client yet.</EmptyTableRow>
            ) : (
              ledger.projects.map((p) => (
                <tr key={p.projectId} className="border-t">
                  <td className="px-4 py-3 font-medium">{p.projectName}</td>
                  <td className="px-4 py-3 text-right">{inr(p.agreementValue)}</td>
                  <td className="px-4 py-3 text-right">{p.billsCount}</td>
                  <td className="px-4 py-3 text-right">{inr(p.totalCertified)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{inr(p.totalReceived)}</td>
                  <td className="px-4 py-3 text-right font-medium text-amber-600">{inr(p.outstanding)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ViewClient() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getClient(id)
      .then(setClient)
      .catch(() => setError("Client not found or failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">
          Loading client...
        </div>
      </Layout>
    );
  }

  if (error || !client) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Client Not Found</h1>
          <p className="mt-2 text-slate-500">{error ?? "This client does not exist."}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <ClientOverview
          companyName={client.companyName}
          clientCode={client.clientCode}
          contactPerson={client.contactPerson}
          mobile={client.mobile}
          email={client.email}
          gst={client.gst}
          pan={client.pan}
          address={client.address}
          city={client.city}
          state={client.state}
          pincode={client.pincode}
          website={client.website}
          status={client.status}
          notes={client.notes}
        />
        <ClientLedgerPanel clientId={client.id} />
      </div>
    </Layout>
  );
}
