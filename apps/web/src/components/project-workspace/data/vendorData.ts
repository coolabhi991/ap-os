import { Building2, Contact2, FileText, ReceiptText, Search, TrendingUp } from "lucide-react";

export const vendorSummaryStats = [
  {
    title: "Active Vendors",
    value: "24",
    subtitle: "Registered suppliers and service partners",
    icon: Building2,
    trend: "+3 this quarter",
  },
  {
    title: "Outstanding Payments",
    value: "₹1.8 Cr",
    subtitle: "Pending vendor settlements",
    icon: ReceiptText,
    trend: "2 due this week",
  },
  {
    title: "Document Completeness",
    value: "92%",
    subtitle: "Vendors with complete records",
    icon: FileText,
    trend: "Improving",
  },
  {
    title: "Performance Score",
    value: "4.6/5",
    subtitle: "Average vendor reliability rating",
    icon: TrendingUp,
    trend: "Above target",
  },
];

export const vendorRows = [
  {
    name: "Metro Supplies",
    category: "Materials",
    contact: "Anil Rao",
    balance: "₹24 L",
    status: "Active",
  },
  {
    name: "BuildMart",
    category: "Materials",
    contact: "Sanjay Iyer",
    balance: "₹18 L",
    status: "Review",
  },
  {
    name: "Fleet Rental Co.",
    category: "Equipment",
    contact: "Meera Shah",
    balance: "₹12 L",
    status: "Active",
  },
  {
    name: "Prime Finishes",
    category: "Finishing",
    contact: "Kunal Das",
    balance: "₹9 L",
    status: "Pending",
  },
];

export const ledgerRows = [
  { date: "08 Jul", entry: "Invoice posted", amount: "₹6.0 L", type: "Credit" },
  { date: "04 Jul", entry: "Payment made", amount: "₹4.2 L", type: "Debit" },
  { date: "01 Jul", entry: "Advance receipt", amount: "₹2.0 L", type: "Credit" },
];

export const paymentRows = [
  { vendor: "Metro Supplies", due: "12 Jul", amount: "₹8.4 L", status: "Pending" },
  { vendor: "BuildMart", due: "15 Jul", amount: "₹6.2 L", status: "Scheduled" },
  { vendor: "Prime Finishes", due: "18 Jul", amount: "₹4.1 L", status: "Pending" },
];

export const performanceRows = [
  { vendor: "Metro Supplies", score: "4.8", delivery: "Excellent" },
  { vendor: "BuildMart", score: "4.2", delivery: "Good" },
  { vendor: "Fleet Rental Co.", score: "4.5", delivery: "Excellent" },
];

export const docRows = [
  { document: "GST Certificate", vendor: "Metro Supplies", status: "Verified" },
  { document: "PAN Card", vendor: "BuildMart", status: "Verified" },
  { document: "Insurance Proof", vendor: "Fleet Rental Co.", status: "Pending" },
];

export const vendorSearchIcon = Search;
export const vendorContactIcon = Contact2;
