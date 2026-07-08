import {
  Boxes,
  PackageCheck,
  PackageOpen,
  ShoppingCart,
  TrendingDown,
  Truck,
} from "lucide-react";
import type { Project } from "../../services/projects";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import PageHeader from "../ui/PageHeader";
import Section from "../ui/Section";
import StatCard from "../ui/StatCard";
import Table from "../ui/Table";

interface MaterialsModuleProps {
  project: Project;
}

const summaryStats = [
  {
    title: "Stock Value",
    value: "₹8.4 Cr",
    subtitle: "Current inventory valuation",
    icon: <Boxes size={20} />,
    trend: "+3.1% vs last month",
  },
  {
    title: "Items in Stock",
    value: "126",
    subtitle: "Active SKUs on site",
    icon: <PackageOpen size={20} />,
    trend: "Balanced availability",
  },
  {
    title: "Low Stock Alerts",
    value: "4",
    subtitle: "Items needing replenishment",
    icon: <TrendingDown size={20} />,
    trend: "2 urgent",
  },
  {
    title: "Pending POs",
    value: "7",
    subtitle: "Open purchase requests",
    icon: <ShoppingCart size={20} />,
    trend: "2 scheduled today",
  },
];

const inventoryRows = [
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

const procurementRows = [
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

const movementRows = [
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

export default function MaterialsModule({ project }: MaterialsModuleProps) {
  return (
    <div className="flex-1 space-y-6">
      <PageHeader
        title="Materials"
        subtitle={`${project.name} • Procurement and inventory oversight for the active site.`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      <Section title="Inventory Status" subtitle="Monitor stock health and replenishment needs across key materials.">
        <Card className="p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none"
                placeholder="Search material"
              />
              <select className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none">
                <option>All categories</option>
                <option>Structural</option>
                <option>Bulk</option>
                <option>MEP</option>
              </select>
            </div>
            <Badge variant="warning">4 items need attention</Badge>
          </div>

          <Table
            columns={[
              { header: "Item", accessor: (item) => item.item },
              { header: "Category", accessor: (item) => item.category },
              { header: "Stock", accessor: (item) => item.stock },
              {
                header: "Status",
                accessor: (item) => (
                  <Badge
                    variant={
                      item.status === "Healthy"
                        ? "success"
                        : item.status === "Low"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {item.status}
                  </Badge>
                ),
              },
              { header: "Lead Time", accessor: (item) => item.leadTime },
            ]}
            data={inventoryRows}
          />
        </Card>
      </Section>

      <Section title="Procurement" subtitle="Track purchase orders, supplier commitments, and expected deliveries.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "PO", accessor: (item) => item.po },
              { header: "Supplier", accessor: (item) => item.supplier },
              { header: "Amount", accessor: (item) => item.amount },
              { header: "ETA", accessor: (item) => item.eta },
              {
                header: "Status",
                accessor: (item) => (
                  <Badge
                    variant={
                      item.status === "Scheduled"
                        ? "info"
                        : item.status === "In Transit"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {item.status}
                  </Badge>
                ),
              },
            ]}
            data={procurementRows}
          />
        </Card>
      </Section>

      <Section title="Stock Movement" subtitle="Recent inventory movements and site consumption updates.">
        <Card className="p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {movementRows.map((row) => (
              <div key={`${row.date}-${row.item}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Truck size={16} className="text-amber-600" />
                  {row.date}
                </div>
                <p className="mt-3 font-semibold text-slate-900">{row.action}</p>
                <p className="mt-1 text-sm text-slate-600">{row.item}</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{row.quantity}</p>
              </div>
            ))}
          </div>
        </Card>
      </Section>
    </div>
  );
}
