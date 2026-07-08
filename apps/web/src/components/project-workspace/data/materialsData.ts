import { Boxes, PackageOpen, ShoppingCart, TrendingDown, Truck } from "lucide-react";

export const materialsSummaryStats = [
  {
    title: "Stock Value",
    value: "₹8.4 Cr",
    subtitle: "Current inventory valuation",
    icon: Boxes,
    trend: "+3.1% vs last month",
  },
  {
    title: "Items in Stock",
    value: "126",
    subtitle: "Active SKUs on site",
    icon: PackageOpen,
    trend: "Balanced availability",
  },
  {
    title: "Low Stock Alerts",
    value: "4",
    subtitle: "Items needing replenishment",
    icon: TrendingDown,
    trend: "2 urgent",
  },
  {
    title: "Pending POs",
    value: "7",
    subtitle: "Open purchase requests",
    icon: ShoppingCart,
    trend: "2 scheduled today",
  },
];

export const inventoryRows = [
  {
    item: "Steel Reinforcement",
    category: "Structural",
    stock: "184 MT",
    status: "Healthy",
    leadTime: "2 days",
  },
  {
    item: "Cement",
    category: "Bulk",
    stock: "92 Bags",
    status: "Low",
    leadTime: "1 day",
  },
  {
    item: "Pipes",
    category: "MEP",
    stock: "240 Units",
    status: "Healthy",
    leadTime: "3 days",
  },
  {
    item: "Electrical Wires",
    category: "Electrical",
    stock: "38 Rolls",
    status: "Critical",
    leadTime: "4 days",
  },
];

export const procurementRows = [
  {
    po: "PO-204",
    supplier: "Metro Supplies",
    amount: "₹24 L",
    eta: "09 Jul 2026",
    status: "Scheduled",
  },
  {
    po: "PO-203",
    supplier: "BuildMart",
    amount: "₹18 L",
    eta: "11 Jul 2026",
    status: "In Transit",
  },
  {
    po: "PO-202",
    supplier: "Fleet Rental Co.",
    amount: "₹9 L",
    eta: "12 Jul 2026",
    status: "Pending",
  },
];

export const movementRows = [
  {
    date: "08 Jul",
    action: "Issued to site",
    item: "Cement",
    quantity: "20 Bags",
  },
  {
    date: "07 Jul",
    action: "Received from vendor",
    item: "Steel",
    quantity: "12 MT",
  },
  {
    date: "06 Jul",
    action: "Transferred to storage",
    item: "Pipes",
    quantity: "60 Units",
  },
];

export const materialsMovementIcon = Truck;
