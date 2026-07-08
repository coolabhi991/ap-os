import { Truck } from "lucide-react";
import type { Project } from "../../services/projects";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import Section from "../ui/Section";
import Table from "../ui/Table";
import { inventoryRows, materialsSummaryStats, movementRows, procurementRows } from "./data/materialsData";
import WorkspaceModuleLayout from "./WorkspaceModuleLayout";

interface MaterialsModuleProps {
  project: Project;
}

export default function MaterialsModule({ project }: MaterialsModuleProps) {
  return (
    <WorkspaceModuleLayout
      title="Materials"
      subtitle={`${project.name} • Procurement and inventory oversight for the active site.`}
      summaryStats={materialsSummaryStats}
    >
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
    </WorkspaceModuleLayout>
  );
}
