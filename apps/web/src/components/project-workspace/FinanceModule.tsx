import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  CircleDollarSign,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { Project } from "../../services/projects";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import PageHeader from "../ui/PageHeader";
import Section from "../ui/Section";
import StatCard from "../ui/StatCard";
import Table from "../ui/Table";

interface FinanceModuleProps {
  project: Project;
}

const summaryStats = [
  {
    title: "Total Contract Value",
    value: "₹27.0 Cr",
    subtitle: "Approved contract amount",
    icon: <CircleDollarSign size={20} />,
    trend: "+4.2% vs plan",
  },
  {
    title: "Total Bills Submitted",
    value: "₹18.6 Cr",
    subtitle: "Interim billing submitted",
    icon: <ReceiptText size={20} />,
    trend: "+2.1% this month",
  },
  {
    title: "Amount Received",
    value: "₹15.4 Cr",
    subtitle: "Payments cleared to date",
    icon: <Banknote size={20} />,
    trend: "96% collection rate",
  },
  {
    title: "Pending Receivables",
    value: "₹3.2 Cr",
    subtitle: "Outstanding client dues",
    icon: <Wallet size={20} />,
    trend: "3 bills due soon",
  },
  {
    title: "Total Expenses",
    value: "₹12.1 Cr",
    subtitle: "Site and office outflows",
    icon: <BriefcaseBusiness size={20} />,
    trend: "Within forecast",
  },
  {
    title: "Net Profit",
    value: "₹3.3 Cr",
    subtitle: "Project margin estimate",
    icon: <TrendingUp size={20} />,
    trend: "+8.6% margin",
  },
];

const receivables = [
  {
    bill: "Running Bill #08",
    client: "NMC",
    amount: "₹2.4 Cr",
    status: "Pending",
    due: "14 Jul 2026",
  },
  {
    bill: "Running Bill #07",
    client: "NMC",
    amount: "₹1.8 Cr",
    status: "Partially Paid",
    due: "09 Jul 2026",
  },
  {
    bill: "Running Bill #06",
    client: "NMC",
    amount: "₹1.1 Cr",
    status: "Cleared",
    due: "02 Jul 2026",
  },
];

const payables = [
  {
    category: "Vendor Payments",
    party: "Metro Supplies",
    amount: "₹68 L",
    status: "Scheduled",
  },
  {
    category: "Labour Payments",
    party: "Crew Alpha",
    amount: "₹42 L",
    status: "Pending",
  },
  {
    category: "Machinery Payments",
    party: "Fleet Rental Co.",
    amount: "₹31 L",
    status: "Cleared",
  },
  {
    category: "Material Payments",
    party: "BuildMart",
    amount: "₹57 L",
    status: "In Review",
  },
];

const expenses = [
  {
    category: "Site-wise expenses",
    description: "Concrete and reinforcement",
    amount: "₹24 L",
    period: "Jun 2026",
  },
  {
    category: "Office expenses",
    description: "Stationery and admin",
    amount: "₹3.8 L",
    period: "Jun 2026",
  },
  {
    category: "Confidential expenses",
    description: "Consulting and compliance",
    amount: "₹7.2 L",
    period: "Jun 2026",
  },
];

const cashFlow = [
  { month: "Jan", inflow: 4.2, outflow: 3.4, balance: 0.8 },
  { month: "Feb", inflow: 4.6, outflow: 3.7, balance: 1.7 },
  { month: "Mar", inflow: 5.1, outflow: 4.1, balance: 2.7 },
  { month: "Apr", inflow: 5.4, outflow: 4.5, balance: 3.6 },
  { month: "May", inflow: 5.8, outflow: 4.8, balance: 4.6 },
  { month: "Jun", inflow: 6.2, outflow: 5.1, balance: 5.7 },
];

export default function FinanceModule({ project }: FinanceModuleProps) {
  return (
    <div className="flex-1 space-y-6">
      <PageHeader
        title="Finance"
        subtitle={`${project.name} • Mock finance workspace for planning and review.`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryStats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </div>

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
                data={receivables}
              />
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Payment History
            </p>
            <div className="mt-5 space-y-3">
              {[
                {
                  title: "Receipt #241",
                  detail: "Received from NMC • 12 Jun 2026",
                  amount: "+₹1.2 Cr",
                  positive: true,
                },
                {
                  title: "Receipt #240",
                  detail: "Received from NMC • 06 Jun 2026",
                  amount: "+₹1.0 Cr",
                  positive: true,
                },
                {
                  title: "Receipt #239",
                  detail: "Pending follow-up • 29 May 2026",
                  amount: "₹0.8 Cr",
                  positive: false,
                },
              ].map((item) => (
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
            data={payables}
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
            data={expenses}
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
            {cashFlow.map((item) => (
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
    </div>
  );
}
