import { Briefcase, Clock3, HardHat, TrendingUp } from "lucide-react";
import type { Project } from "../../services/projects";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import Section from "../ui/Section";
import Table from "../ui/Table";
import { attendanceRows, contractorRows, dailyStrengthRows, labourSummaryStats, overtimeRows, productivityRows, wageRows } from "./data/labourData";
import WorkspaceModuleLayout from "./WorkspaceModuleLayout";

interface LabourModuleProps {
  project: Project;
}

export default function LabourModule({ project }: LabourModuleProps) {
  return (
    <WorkspaceModuleLayout
      title="Labour Management"
      subtitle={`${project.name} • Mock labour operations for planning, payroll, and productivity review.`}
      summaryStats={labourSummaryStats}
    >
      <Section title="Attendance Register" subtitle="Daily workforce presence and shift-level attendance status.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Worker", accessor: (item) => item.worker },
              { header: "Role", accessor: (item) => item.role },
              { header: "Shift", accessor: (item) => item.shift },
              {
                header: "Status",
                accessor: (item) => (
                  <Badge
                    variant={
                      item.status === "Present"
                        ? "success"
                        : item.status === "Late"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {item.status}
                  </Badge>
                ),
              },
              { header: "Hours", accessor: (item) => item.hours },
            ]}
            data={attendanceRows}
          />
        </Card>
      </Section>

      <Section title="Contractor List" subtitle="Track contractors, trade coverage, and current workforce strength.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Contractor", accessor: (item) => item.contractor },
              { header: "Trade", accessor: (item) => item.trade },
              { header: "Strength", accessor: (item) => item.strength },
              { header: "Rate", accessor: (item) => item.rate },
              {
                header: "Status",
                accessor: (item) => (
                  <Badge variant={item.status === "Active" ? "success" : "warning"}>{item.status}</Badge>
                ),
              },
            ]}
            data={contractorRows}
          />
        </Card>
      </Section>

      <Section title="Daily Labour Strength" subtitle="Plan workforce intensity across the current workweek.">
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-5">
            {dailyStrengthRows.map((row) => (
              <div key={row.day} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <HardHat size={16} className="text-amber-600" />
                  {row.day}
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{row.count}</p>
                <p className="mt-2 text-sm text-slate-600">{row.note}</p>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="Wage Register" subtitle="Payroll summary for the current wage cycle.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Worker", accessor: (item) => item.worker },
              { header: "Category", accessor: (item) => item.category },
              { header: "Wage", accessor: (item) => item.wage },
              {
                header: "Status",
                accessor: (item) => (
                  <Badge variant={item.status === "Processed" ? "success" : "warning"}>{item.status}</Badge>
                ),
              },
            ]}
            data={wageRows}
          />
        </Card>
      </Section>

      <Section title="Overtime Register" subtitle="Approved and pending overtime entries by worker.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Worker", accessor: (item) => item.worker },
              { header: "Hours", accessor: (item) => item.hours },
              { header: "Reason", accessor: (item) => item.reason },
              {
                header: "Approved",
                accessor: (item) => (
                  <Badge variant={item.approved === "Yes" ? "success" : "warning"}>{item.approved}</Badge>
                ),
              },
            ]}
            data={overtimeRows}
          />
        </Card>
      </Section>

      <Section title="Labour Cost Analysis" subtitle="Current cost distribution and workforce efficiency indicators.">
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Briefcase size={16} className="text-amber-600" />
                Direct Labour
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-900">₹24.8 L</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <TrendingUp size={16} className="text-emerald-600" />
                Contractor Cost
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-900">₹17.2 L</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Clock3 size={16} className="text-sky-600" />
                Overtime Cost
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-900">₹3.1 L</p>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Productivity Report" subtitle="Workfront trends by task type and productivity status.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Task", accessor: (item) => item.task },
              { header: "Output", accessor: (item) => item.output },
              {
                header: "Efficiency",
                accessor: (item) => (
                  <Badge
                    variant={
                      item.efficiency === "High"
                        ? "success"
                        : item.efficiency === "Stable"
                          ? "info"
                          : "warning"
                    }
                  >
                    {item.efficiency}
                  </Badge>
                ),
              },
            ]}
            data={productivityRows}
          />
        </Card>
      </Section>
    </WorkspaceModuleLayout>
  );
}
