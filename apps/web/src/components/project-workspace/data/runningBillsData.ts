import { BadgeCheck, Banknote, CalendarClock, CircleDollarSign, FileText, Receipt } from "lucide-react";

export const runningBillsSummaryStats = [
  {
    title: "Current Bill",
    value: "RA-08",
    subtitle: "Active running bill cycle",
    icon: Receipt,
    trend: "Prepared this week",
  },
  {
    title: "Submitted Value",
    value: "₹4.2 Cr",
    subtitle: "Bills submitted to client",
    icon: CircleDollarSign,
    trend: "+8% vs last period",
  },
  {
    title: "Pending Bills",
    value: "3",
    subtitle: "Awaiting review or payment",
    icon: CalendarClock,
    trend: "2 due this week",
  },
  {
    title: "Amount Paid",
    value: "₹3.6 Cr",
    subtitle: "Payments cleared to date",
    icon: Banknote,
    trend: "86% of submitted",
  },
];

export const billRows = [
  {
    bill: "RA-08",
    period: "Jun 2026",
    amount: "₹1.24 Cr",
    status: "Submitted",
    due: "14 Jul",
  },
  {
    bill: "RA-07",
    period: "May 2026",
    amount: "₹1.12 Cr",
    status: "Approved",
    due: "09 Jul",
  },
  {
    bill: "RA-06",
    period: "Apr 2026",
    amount: "₹0.96 Cr",
    status: "Paid",
    due: "02 Jul",
  },
  {
    bill: "RA-05",
    period: "Mar 2026",
    amount: "₹0.88 Cr",
    status: "Draft",
    due: "20 Jun",
  },
];

export const measurementRows = [
  { item: "Earthwork", quantity: "2,840 m³", rate: "₹620", amount: "₹17.6 L" },
  { item: "Concrete", quantity: "340 m³", rate: "₹7,800", amount: "₹26.5 L" },
  { item: "Steel Fixing", quantity: "184 MT", rate: "₹8,400", amount: "₹15.4 L" },
];

export const historyRows = [
  { date: "08 Jul", event: "Bill submitted", note: "RA-08 prepared and sent" },
  { date: "04 Jul", event: "Client review", note: "Measurement sheet verified" },
  { date: "01 Jul", event: "Payment cleared", note: "RA-07 payment received" },
];

export const timelineRows = [
  { step: "Draft prepared", date: "01 Jul", status: "Completed" },
  { step: "Measurement verified", date: "03 Jul", status: "Completed" },
  { step: "Submitted to client", date: "08 Jul", status: "In Progress" },
  { step: "Approval pending", date: "14 Jul", status: "Pending" },
];

export const runningBillsDetailIcon = FileText;
export const runningBillsRetentionIcon = BadgeCheck;
