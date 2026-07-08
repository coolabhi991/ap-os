import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Project } from "../../services/projects";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import Section from "../ui/Section";
import Table from "../ui/Table";
import { financeCashFlow, financeExpenses, financePayables, financePaymentHistory, financeReceivables, financeSummaryStats } from "./data/financeData";
import WorkspaceModuleLayout from "./WorkspaceModuleLayout";

interface FinanceModuleProps {
  project: Project;
}

export default function FinanceModule({ project }: FinanceModuleProps) {
  return (
    <WorkspaceModuleLayout
      title="Finance"
      subtitle={`${project.name} • Mock finance workspace for planning and review.`}
      summaryStats={financeSummaryStats}
    >
      <Section title="Receivables" subtitle="Monitor client billing, due dates, and payment status.">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Running Bills
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Outstanding client receivables
                </h3>
              </div>
              <Badge variant="warning">3 due soon</Badge>
            </div>

            <div className="mt-5">
              <Table
                columns={[
                  { header: "Bill", accessor: (item) => item.bill },
                  { header: "Client", accessor: (item) => item.client },
                  { header: "Amount", accessor: (item) => item.amount },
                  {
                    header: "Status",
                    accessor: (item) => (
                      <Badge
                        variant={
                          item.status === "Cleared"
                            ? "success"
                            : item.status === "Partially Paid"
                              ? "info"
                              : "warning"
                        }
                      >
                        {item.status}
                      </Badge>
                    ),
                  },
                  { header: "Due", accessor: (item) => item.due },
                ]}
                data={financeReceivables}
              />
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Payment History
            </p>
            <div className="mt-5 space-y-3">
              {financePaymentHistory.map((item) => (
                <div key={item.title} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.detail}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-semibold ${item.positive ? "text-emerald-600" : "text-amber-600"}`}>
                    {item.positive ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                    {item.amount}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Payables" subtitle="Keep vendor, labour, machinery, and material commitments under control.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Category", accessor: (item) => item.category },
              { header: "Party", accessor: (item) => item.party },
              { header: "Amount", accessor: (item) => item.amount },
              {
                header: "Status",
                accessor: (item) => <Badge variant={item.status === "Cleared" ? "success" : item.status === "Scheduled" ? "info" : "warning"}>{item.status}</Badge>,
              },
            ]}
            data={financePayables}
          />
        </Card>
      </Section>

      <Section title="Expense Register" subtitle="Filter site, office, and confidential spend by period and category.">
        <Card className="p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none"
                placeholder="Search expense"
              />
              <select className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none">
                <option>All categories</option>
                <option>Site-wise expenses</option>
                <option>Office expenses</option>
                <option>Confidential expenses</option>
              </select>
            </div>
            <Badge variant="neutral">Last updated 2 hours ago</Badge>
          </div>

          <Table
            columns={[
              { header: "Category", accessor: (item) => item.category },
              { header: "Description", accessor: (item) => item.description },
              { header: "Amount", accessor: (item) => item.amount },
              { header: "Period", accessor: (item) => item.period },
            ]}
            data={financeExpenses}
          />
        </Card>
      </Section>

      <Section title="Cash Flow" subtitle="Track monthly inflow, outflow, and balance trend.">
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">Monthly Inflow</p>
              <h3 className="mt-2 text-2xl font-semibold text-emerald-800">₹6.2 Cr</h3>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-700">Monthly Outflow</p>
              <h3 className="mt-2 text-2xl font-semibold text-amber-800">₹5.1 Cr</h3>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-sm text-sky-700">Closing Balance</p>
              <h3 className="mt-2 text-2xl font-semibold text-sky-800">₹5.7 Cr</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-6">
            {financeCashFlow.map((item) => (
              <div key={item.month} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">{item.month}</p>
                <div className="mt-4 flex flex-col gap-2">
                  <div className="h-2 rounded-full bg-emerald-200">
                    <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${item.inflow * 18}%` }} />
                  </div>
                  <div className="h-2 rounded-full bg-amber-200">
                    <div className="h-2 rounded-full bg-amber-500" style={{ width: `${item.outflow * 18}%` }} />
                  </div>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">Bal ₹{item.balance.toFixed(1)} Cr</p>
              </div>
            ))}
          </div>
        </Card>
      </Section>
    </WorkspaceModuleLayout>
  );
}
