import { Contact2, Search } from "lucide-react";
import type { Project } from "../../services/projects";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import Section from "../ui/Section";
import Table from "../ui/Table";
import { docRows, ledgerRows, paymentRows, performanceRows, vendorRows, vendorSummaryStats } from "./data/vendorData";
import WorkspaceModuleLayout from "./WorkspaceModuleLayout";

interface VendorModuleProps {
  project: Project;
}

export default function VendorModule({ project }: VendorModuleProps) {
  return (
    <WorkspaceModuleLayout
      title="Vendor Management"
      subtitle={`${project.name} • Mock vendor directory, payments, and performance tracking for procurement planning.`}
      summaryStats={vendorSummaryStats}
    >
      <Section title="Vendor Master" subtitle="A centralized vendor directory with core contact and status details.">
        <Card className="p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600">
                <Search size={16} />
                <input className="outline-none" placeholder="Search vendor" />
              </div>
              <select className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none">
                <option>All categories</option>
                <option>Materials</option>
                <option>Equipment</option>
                <option>Finishing</option>
              </select>
            </div>
            <Badge variant="neutral">Filtered for project use</Badge>
          </div>

          <Table
            columns={[
              { header: "Vendor", accessor: (item) => item.name },
              { header: "Category", accessor: (item) => item.category },
              { header: "Contact", accessor: (item) => item.contact },
              { header: "Balance", accessor: (item) => item.balance },
              {
                header: "Status",
                accessor: (item) => (
                  <Badge variant={item.status === "Active" ? "success" : item.status === "Review" ? "warning" : "neutral"}>{item.status}</Badge>
                ),
              },
            ]}
            data={vendorRows}
          />
        </Card>
      </Section>

      <Section title="Vendor Categories" subtitle="Category-level vendor segmentation for procurement planning.">
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Materials", count: "10 vendors", tone: "bg-slate-50" },
              { label: "Equipment", count: "6 vendors", tone: "bg-amber-50" },
              { label: "Finishing", count: "8 vendors", tone: "bg-emerald-50" },
            ].map((item) => (
              <div key={item.label} className={`rounded-2xl border border-slate-200 p-4 ${item.tone}`}>
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{item.count}</p>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="Vendor Ledger" subtitle="Recent ledger entries for invoices, payments, and advances.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Date", accessor: (item) => item.date },
              { header: "Entry", accessor: (item) => item.entry },
              { header: "Amount", accessor: (item) => item.amount },
              { header: "Type", accessor: (item) => item.type },
            ]}
            data={ledgerRows}
          />
        </Card>
      </Section>

      <Section title="Outstanding Payments" subtitle="Upcoming liabilities and pending vendor settlements.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Vendor", accessor: (item) => item.vendor },
              { header: "Due", accessor: (item) => item.due },
              { header: "Amount", accessor: (item) => item.amount },
              {
                header: "Status",
                accessor: (item) => <Badge variant={item.status === "Pending" ? "warning" : "info"}>{item.status}</Badge>,
              },
            ]}
            data={paymentRows}
          />
        </Card>
      </Section>

      <Section title="Payment History" subtitle="A compact trail of recent vendor payments.">
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Last Payment", value: "₹4.2 L", detail: "Metro Supplies • 08 Jul" },
              { title: "This Month", value: "₹28.6 L", detail: "Across 6 vendors" },
              { title: "Average Delay", value: "2 days", detail: "Against due date" },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">{item.title}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
                <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="Vendor Performance" subtitle="Reliability and delivery quality indicators.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Vendor", accessor: (item) => item.vendor },
              { header: "Score", accessor: (item) => item.score },
              { header: "Delivery", accessor: (item) => item.delivery },
            ]}
            data={performanceRows}
          />
        </Card>
      </Section>

      <Section title="Contact Information" subtitle="Primary contacts and communication channels for vendor coordination.">
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Metro Supplies", value: "Anil Rao • +91 99880 11223", icon: <Contact2 size={16} /> },
              { label: "BuildMart", value: "Sanjay Iyer • +91 99210 55334", icon: <Contact2 size={16} /> },
              { label: "Fleet Rental Co.", value: "Meera Shah • +91 98666 44120", icon: <Contact2 size={16} /> },
              { label: "Prime Finishes", value: "Kunal Das • +91 98123 77890", icon: <Contact2 size={16} /> },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  {item.icon}
                  {item.label}
                </div>
                <p className="mt-3 text-sm text-slate-700">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="Documents" subtitle="Essential vendor documentation and compliance statuses.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Document", accessor: (item) => item.document },
              { header: "Vendor", accessor: (item) => item.vendor },
              {
                header: "Status",
                accessor: (item) => <Badge variant={item.status === "Verified" ? "success" : "warning"}>{item.status}</Badge>,
              },
            ]}
            data={docRows}
          />
        </Card>
      </Section>
    </WorkspaceModuleLayout>
  );
}
