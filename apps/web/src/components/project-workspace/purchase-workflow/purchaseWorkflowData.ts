import { Boxes, ClipboardList, PackageCheck, Truck, Warehouse } from "lucide-react";

export const purchaseWorkflowSteps = [
  {
    id: "requisition",
    title: "Purchase Requisition",
    subtitle: "Request materials and services for the project.",
    icon: ClipboardList,
  },
  {
    id: "purchase-order",
    title: "Purchase Order",
    subtitle: "Issue formal purchase orders to approved vendors.",
    icon: ClipboardList,
  },
  {
    id: "vendor-selection",
    title: "Vendor Selection",
    subtitle: "Compare bids and finalize the best supplier.",
    icon: Truck,
  },
  {
    id: "material-receipt",
    title: "Material Receipt",
    subtitle: "Record deliveries and verify received quantities.",
    icon: PackageCheck,
  },
  {
    id: "inventory-update",
    title: "Inventory Update",
    subtitle: "Update stock levels after successful receipt.",
    icon: Warehouse,
  },
  {
    id: "issue-site",
    title: "Material Issue to Site",
    subtitle: "Release materials for execution and track consumption.",
    icon: Boxes,
  },
];

export const requisitionRows = [
  { item: "Cement - OPC 53", quantity: "240 bags", requirement: "Foundation slab", priority: "High" },
  { item: "Steel TMT 500D", quantity: "48 MT", requirement: "Structural frame", priority: "High" },
  { item: "Pipes - 150mm", quantity: "180 m", requirement: "Waterline", priority: "Medium" },
];

export const poRows = [
  { po: "PO-1042", vendor: "Metro Supplies", amount: "₹4.8 L", status: "Approved" },
  { po: "PO-1043", vendor: "BuildMart", amount: "₹6.2 L", status: "Pending" },
  { po: "PO-1044", vendor: "Prime Finishes", amount: "₹2.4 L", status: "Draft" },
];

export const vendorRows = [
  { vendor: "Metro Supplies", score: "4.8", leadTime: "3 days", status: "Preferred" },
  { vendor: "BuildMart", score: "4.2", leadTime: "5 days", status: "Approved" },
  { vendor: "Prime Finishes", score: "4.5", leadTime: "4 days", status: "Review" },
];

export const receiptRows = [
  { delivery: "GRN-2101", item: "Cement - OPC 53", received: "240 bags", status: "Matched" },
  { delivery: "GRN-2102", item: "Steel TMT 500D", received: "48 MT", status: "Pending QA" },
  { delivery: "GRN-2103", item: "Pipes - 150mm", received: "180 m", status: "Received" },
];

export const inventoryRows = [
  { item: "Cement - OPC 53", stock: "240 bags", location: "Yard A", status: "Healthy" },
  { item: "Steel TMT 500D", stock: "48 MT", location: "Yard B", status: "Healthy" },
  { item: "Pipes - 150mm", stock: "180 m", location: "Yard C", status: "Low" },
];

export const issueRows = [
  { site: "North Zone", item: "Cement - OPC 53", issued: "120 bags", issuedBy: "Site Engineer" },
  { site: "Central Yard", item: "Steel TMT 500D", issued: "24 MT", issuedBy: "Store In charge" },
  { site: "Waterline", item: "Pipes - 150mm", issued: "90 m", issuedBy: "Site Engineer" },
];
