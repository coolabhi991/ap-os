import { Bike } from "lucide-react";
import type { Project } from "../../services/projects";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import Section from "../ui/Section";
import Table from "../ui/Table";
import { allocationRows, breakdownRows, equipmentRows, equipmentSummaryStats, fuelRows, maintenanceRows, operatingCostRows, utilizationRows } from "./data/equipmentData";
import WorkspaceModuleLayout from "./WorkspaceModuleLayout";

interface EquipmentModuleProps {
  project: Project;
}

export default function EquipmentModule({ project }: EquipmentModuleProps) {
  return (
    <WorkspaceModuleLayout
      title="Equipment Management"
      subtitle={`${project.name} • Mock equipment oversight for allocation, utilization, and maintenance planning.`}
      summaryStats={equipmentSummaryStats}
    >
      <Section title="Equipment Register" subtitle="Core equipment inventory with current status and deployment location.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Asset", accessor: (item) => item.asset },
              { header: "Type", accessor: (item) => item.type },
              {
                header: "Status",
                accessor: (item) => (
                  <Badge
                    variant={
                      item.status === "Running"
                        ? "success"
                        : item.status === "Idle"
                          ? "warning"
                          : "info"
                    }
                  >
                    {item.status}
                  </Badge>
                ),
              },
              { header: "Site", accessor: (item) => item.site },
              { header: "Hours", accessor: (item) => item.hours },
            ]}
            data={equipmentRows}
          />
        </Card>
      </Section>

      <Section title="Equipment Allocation by Project" subtitle="Current assignment visibility for this project workspace.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Project", accessor: (item) => item.project },
              { header: "Asset", accessor: (item) => item.asset },
              { header: "Shift", accessor: (item) => item.shift },
              {
                header: "Status",
                accessor: (item) => (
                  <Badge variant={item.status === "Active" ? "success" : item.status === "Standby" ? "warning" : "info"}>{item.status}</Badge>
                ),
              },
            ]}
            data={allocationRows}
          />
        </Card>
      </Section>

      <Section title="Fuel Consumption" subtitle="Monthly fuel usage by equipment unit.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Asset", accessor: (item) => item.asset },
              { header: "Liters", accessor: (item) => item.liters },
              { header: "Cost", accessor: (item) => item.cost },
              { header: "Period", accessor: (item) => item.period },
            ]}
            data={fuelRows}
          />
        </Card>
      </Section>

      <Section title="Maintenance Schedule" subtitle="Planned service and inspection tasks for the fleet.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Asset", accessor: (item) => item.asset },
              { header: "Task", accessor: (item) => item.task },
              { header: "Date", accessor: (item) => item.date },
              {
                header: "Status",
                accessor: (item) => <Badge variant={item.status === "Scheduled" ? "info" : "warning"}>{item.status}</Badge>,
              },
            ]}
            data={maintenanceRows}
          />
        </Card>
      </Section>

      <Section title="Breakdown Log" subtitle="Recent machine issues and severity notes.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Asset", accessor: (item) => item.asset },
              { header: "Issue", accessor: (item) => item.issue },
              { header: "Date", accessor: (item) => item.date },
              {
                header: "Severity",
                accessor: (item) => <Badge variant={item.severity === "High" ? "danger" : "warning"}>{item.severity}</Badge>,
              },
            ]}
            data={breakdownRows}
          />
        </Card>
      </Section>

      <Section title="Utilization Report" subtitle="Workload distribution and productivity readiness by equipment unit.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Asset", accessor: (item) => item.asset },
              { header: "Utilization", accessor: (item) => item.utilization },
              {
                header: "Productivity",
                accessor: (item) => <Badge variant={item.productivity === "High" ? "success" : item.productivity === "Stable" ? "info" : "warning"}>{item.productivity}</Badge>,
              },
            ]}
            data={utilizationRows}
          />
        </Card>
      </Section>

      <Section title="Operating Cost Summary" subtitle="Rolling cost snapshot across core operating categories.">
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {operatingCostRows.map((row) => (
              <div key={row.item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Bike size={16} className="text-amber-600" />
                  {row.item}
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{row.amount}</p>
              </div>
            ))}
          </div>
        </Card>
      </Section>
    </WorkspaceModuleLayout>
  );
}
