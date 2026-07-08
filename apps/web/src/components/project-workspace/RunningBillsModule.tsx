import { BadgeCheck, FileText } from "lucide-react";
import type { Project } from "../../services/projects";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import Section from "../ui/Section";
import Table from "../ui/Table";
import { billRows, historyRows, measurementRows, runningBillsSummaryStats, timelineRows } from "./data/runningBillsData";
import WorkspaceModuleLayout from "./WorkspaceModuleLayout";

interface RunningBillsModuleProps {
  project: Project;
}

export default function RunningBillsModule({ project }: RunningBillsModuleProps) {
  return (
    <WorkspaceModuleLayout
      title="Running Bills"
      subtitle={`${project.name} • Mock billing workspace for RA bill review, payment tracking, and history.`}
      summaryStats={runningBillsSummaryStats}
    >
      <Section title="Bill Register" subtitle="Track current and historical running bills with their lifecycle status.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Bill", accessor: (item) => item.bill },
              { header: "Period", accessor: (item) => item.period },
              { header: "Amount", accessor: (item) => item.amount },
              {
                header: "Status",
                accessor: (item) => (
                  <Badge
                    variant={
                      item.status === "Paid"
                        ? "success"
                        : item.status === "Approved"
                          ? "info"
                          : item.status === "Submitted"
                            ? "warning"
                            : "neutral"
                    }
                  >
                    {item.status}
                  </Badge>
                ),
              },
              { header: "Due", accessor: (item) => item.due },
            ]}
            data={billRows}
          />
        </Card>
      </Section>

      <Section title="RA Bill Details" subtitle="A snapshot of the current running bill’s measurable work items.">
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <FileText size={16} className="text-amber-600" />
                Bill Reference
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-900">RA-08</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <FileText size={16} className="text-emerald-600" />
                Gross Amount
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-900">₹1.24 Cr</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <BadgeCheck size={16} className="text-sky-600" />
                Retention
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-900">₹8.4 L</p>
            </div>
          </div>

          <div className="mt-6">
            <Table
              columns={[
                { header: "Item", accessor: (item) => item.item },
                { header: "Quantity", accessor: (item) => item.quantity },
                { header: "Rate", accessor: (item) => item.rate },
                { header: "Amount", accessor: (item) => item.amount },
              ]}
              data={measurementRows}
            />
          </div>
        </Card>
      </Section>

      <Section title="Measurement Summary" subtitle="High-level coverage of billed quantities and associated values.">
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Measured Quantity</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">5,964 m³</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Certified Amount</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">₹1.24 Cr</p>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Payment Tracking" subtitle="Payment progress and outstanding amount movement.">
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Received</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">₹3.6 Cr</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Pending</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">₹0.6 Cr</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Next Milestone</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">14 Jul</p>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Bill History" subtitle="Past activity and milestones across the billing lifecycle.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Date", accessor: (item) => item.date },
              { header: "Event", accessor: (item) => item.event },
              { header: "Note", accessor: (item) => item.note },
            ]}
            data={historyRows}
          />
        </Card>
      </Section>

      <Section title="Amount Summary" subtitle="Quarterly billing values and current outstanding balance.">
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Total Billed</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">₹5.8 Cr</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Paid</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">₹4.2 Cr</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Pending</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">₹1.6 Cr</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Retention</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">₹0.4 Cr</p>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Bill Timeline" subtitle="Key milestones for the running bill lifecycle.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Step", accessor: (item) => item.step },
              { header: "Date", accessor: (item) => item.date },
              {
                header: "Status",
                accessor: (item) => <Badge variant={item.status === "Completed" ? "success" : item.status === "In Progress" ? "warning" : "neutral"}>{item.status}</Badge>,
              },
            ]}
            data={timelineRows}
          />
        </Card>
      </Section>
    </WorkspaceModuleLayout>
  );
}
