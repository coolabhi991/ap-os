import { useNavigate } from "react-router-dom";
import {
  Gauge,
  FolderKanban,
  Building2,
  Landmark,
  HardHat,
  HandCoins,
  ScrollText,
  ArrowUpRight,
} from "lucide-react";
import Layout from "../../components/layout/Layout";

interface ReportLink {
  label: string;
  path: string;
  description: string;
}

interface ReportCategory {
  key: string;
  title: string;
  description: string;
  icon: typeof Gauge;
  links: ReportLink[];
}

const CATEGORIES: ReportCategory[] = [
  {
    key: "executive",
    title: "Executive Reports",
    description: "The owner's daily operating view — cash, receivables, payables, and project health in one place.",
    icon: Gauge,
    links: [
      { label: "AP Control Center", path: "/dashboard", description: "Financial KPIs, project health, alerts" },
      { label: "Outstanding Summary", path: "/banking/reports", description: "Receivable vs Payable vs cash position" },
    ],
  },
  {
    key: "project",
    title: "Project Reports",
    description: "Budget vs Actual, cost by sub work, and monthly cost — open a project, then its Reports tab.",
    icon: FolderKanban,
    links: [
      { label: "Projects", path: "/projects", description: "Open any project → Control Center → Reports tab" },
    ],
  },
  {
    key: "vendor",
    title: "Vendor Reports",
    description: "Payables, payments, overdue bills, and top outstanding vendors.",
    icon: Building2,
    links: [
      { label: "Vendor Reports", path: "/reports/vendors", description: "Billed, paid, outstanding, overdue" },
      { label: "Vendors", path: "/vendors", description: "Open any vendor → its full Ledger" },
    ],
  },
  {
    key: "financial",
    title: "Financial Reports",
    description: "Bank Book, Cash Book, Reconciliation, Cash Flow, and Running Bill billing.",
    icon: Landmark,
    links: [
      { label: "Banking Reports", path: "/banking/reports", description: "Bank Book, Cash Book, Reconciliation, Cash Flow" },
      { label: "Running Bill Reports", path: "/running-bills/reports", description: "Register, outstanding, payments, recoveries" },
    ],
  },
  {
    key: "labour",
    title: "Labour Reports",
    description: "Wage register, pending wages, project-wise labour cost.",
    icon: HardHat,
    links: [
      { label: "Labour Reports", path: "/labour/reports", description: "Wage register, pending wages" },
    ],
  },
  {
    key: "expense",
    title: "Expense Reports",
    description: "Site expenses by project, category, and month.",
    icon: HandCoins,
    links: [
      { label: "Expense Reports", path: "/expenses/reports", description: "Project, category, monthly breakdowns" },
    ],
  },
  {
    key: "government",
    title: "Government Reports",
    description: "Government/PWD-format documents — Measurement Book abstract sheets and RA/Final Bill submissions.",
    icon: ScrollText,
    links: [
      { label: "Measurement Book Reports", path: "/measurement-books/reports", description: "MB Register, Abstract Register" },
      { label: "Running Bill Reports", path: "/running-bills/reports", description: "RA Bill / Final Bill register" },
    ],
  },
];

export default function Reports() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
          <p className="mt-2 text-slate-500">Every report in AP OS, organized by area.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.key} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FCF8EC] text-[#B98A1F]">
                    <Icon size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{cat.title}</h2>
                </div>
                <p className="mt-3 text-sm text-slate-500">{cat.description}</p>
                <div className="mt-4 space-y-2">
                  {cat.links.map((l) => (
                    <button
                      key={l.path}
                      onClick={() => navigate(l.path)}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-100 px-4 py-3 text-left transition hover:border-[#D8B44A] hover:bg-[#FCF8EC]"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">{l.label}</p>
                        <p className="text-xs text-slate-400">{l.description}</p>
                      </div>
                      <ArrowUpRight size={16} className="shrink-0 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
