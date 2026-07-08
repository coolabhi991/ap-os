import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { Project } from "../../../services/projects";
import Badge from "../../ui/Badge";
import Button from "../../ui/button";
import Card from "../../ui/Card";
import Section from "../../ui/Section";
import Table from "../../ui/Table";
import WorkspaceModuleLayout from "../WorkspaceModuleLayout";
import {
  inventoryRows,
  issueRows,
  poRows,
  purchaseWorkflowSteps,
  receiptRows,
  requisitionRows,
  vendorRows,
} from "./purchaseWorkflowData";

interface PurchaseWorkflowProps {
  project: Project;
}

export default function PurchaseWorkflow({ project }: PurchaseWorkflowProps) {
  return (
    <WorkspaceModuleLayout
      title="Purchase Management Workflow"
      subtitle={`${project.name} • End-to-end purchase flow from requisition to site issue.`}
    >
      <Section title="Workflow Stages" subtitle="Follow the purchase lifecycle through every approval and handoff.">
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {purchaseWorkflowSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <Icon size={16} className="text-amber-600" />
                      {step.title}
                    </div>
                    <Badge variant="neutral">{index + 1}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{step.subtitle}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-600">
                    <CheckCircle2 size={16} />
                    Completed in mock flow
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </Section>

      <Section title="Purchase Requisition" subtitle="Material requests generated for the active project.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Item", accessor: (item) => item.item },
              { header: "Quantity", accessor: (item) => item.quantity },
              { header: "Requirement", accessor: (item) => item.requirement },
              { header: "Priority", accessor: (item) => <Badge variant={item.priority === "High" ? "warning" : "info"}>{item.priority}</Badge> },
            ]}
            data={requisitionRows}
          />
          <div className="mt-5 flex justify-end">
            <Button variant="secondary">
              Create Requisition
              <ArrowRight size={16} />
            </Button>
          </div>
        </Card>
      </Section>

      <Section title="Purchase Order" subtitle="Formal orders emitted to approved suppliers.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "PO", accessor: (item) => item.po },
              { header: "Vendor", accessor: (item) => item.vendor },
              { header: "Amount", accessor: (item) => item.amount },
              { header: "Status", accessor: (item) => <Badge variant={item.status === "Approved" ? "success" : item.status === "Pending" ? "warning" : "neutral"}>{item.status}</Badge> },
            ]}
            data={poRows}
          />
        </Card>
      </Section>

      <Section title="Vendor Selection" subtitle="Supplier comparison and decision support.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Vendor", accessor: (item) => item.vendor },
              { header: "Score", accessor: (item) => item.score },
              { header: "Lead Time", accessor: (item) => item.leadTime },
              { header: "Status", accessor: (item) => <Badge variant={item.status === "Preferred" ? "success" : item.status === "Approved" ? "info" : "warning"}>{item.status}</Badge> },
            ]}
            data={vendorRows}
          />
        </Card>
      </Section>

      <Section title="Material Receipt" subtitle="Goods receipt notes and quantity verification.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Delivery", accessor: (item) => item.delivery },
              { header: "Item", accessor: (item) => item.item },
              { header: "Received", accessor: (item) => item.received },
              { header: "Status", accessor: (item) => <Badge variant={item.status === "Matched" ? "success" : item.status === "Received" ? "info" : "warning"}>{item.status}</Badge> },
            ]}
            data={receiptRows}
          />
        </Card>
      </Section>

      <Section title="Inventory Update" subtitle="Stock records refreshed after receipt.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Item", accessor: (item) => item.item },
              { header: "Stock", accessor: (item) => item.stock },
              { header: "Location", accessor: (item) => item.location },
              { header: "Status", accessor: (item) => <Badge variant={item.status === "Healthy" ? "success" : "warning"}>{item.status}</Badge> },
            ]}
            data={inventoryRows}
          />
        </Card>
      </Section>

      <Section title="Material Issue to Site" subtitle="Final step: materials issued to execution teams.">
        <Card className="p-6">
          <Table
            columns={[
              { header: "Site", accessor: (item) => item.site },
              { header: "Item", accessor: (item) => item.item },
              { header: "Issued", accessor: (item) => item.issued },
              { header: "Issued By", accessor: (item) => item.issuedBy },
            ]}
            data={issueRows}
          />
        </Card>
      </Section>
    </WorkspaceModuleLayout>
  );
}
