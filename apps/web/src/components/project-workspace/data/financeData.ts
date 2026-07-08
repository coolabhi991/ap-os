import {
  Banknote,
  BriefcaseBusiness,
  CircleDollarSign,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react";

export const financeSummaryStats = [
  {
    title: "Total Contract Value",
    value: "₹27.0 Cr",
    subtitle: "Approved contract amount",
    icon: CircleDollarSign,
    trend: "+4.2% vs plan",
  },
  {
    title: "Total Bills Submitted",
    value: "₹18.6 Cr",
    subtitle: "Interim billing submitted",
    icon: ReceiptText,
    trend: "+2.1% this month",
  },
  {
    title: "Amount Received",
    value: "₹15.4 Cr",
    subtitle: "Payments cleared to date",
    icon: Banknote,
    trend: "96% collection rate",
  },
  {
    title: "Pending Receivables",
    value: "₹3.2 Cr",
    subtitle: "Outstanding client dues",
    icon: Wallet,
    trend: "3 bills due soon",
  },
  {
    title: "Total Expenses",
    value: "₹12.1 Cr",
    subtitle: "Site and office outflows",
    icon: BriefcaseBusiness,
    trend: "Within forecast",
  },
  {
    title: "Net Profit",
    value: "₹3.3 Cr",
    subtitle: "Project margin estimate",
    icon: TrendingUp,
    trend: "+8.6% margin",
  },
];

export const financeReceivables = [
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

export const financePayables = [
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

export const financeExpenses = [
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

export const financeCashFlow = [
  { month: "Jan", inflow: 4.2, outflow: 3.4, balance: 0.8 },
  { month: "Feb", inflow: 4.6, outflow: 3.7, balance: 1.7 },
  { month: "Mar", inflow: 5.1, outflow: 4.1, balance: 2.7 },
  { month: "Apr", inflow: 5.4, outflow: 4.5, balance: 3.6 },
  { month: "May", inflow: 5.8, outflow: 4.8, balance: 4.6 },
  { month: "Jun", inflow: 6.2, outflow: 5.1, balance: 5.7 },
];

export const financePaymentHistory = [
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
];
