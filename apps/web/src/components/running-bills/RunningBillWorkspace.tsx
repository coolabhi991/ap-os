import { useState } from "react";
import type { RunningBill, PaymentRegisterRow } from "../../services/running-bills";
import OverviewTab from "./tabs/OverviewTab";
import Form58Tab from "./tabs/Form58Tab";
import DeductionsTab from "./tabs/DeductionsTab";
import PaymentStatusTab from "./tabs/PaymentStatusTab";
import DocumentsTab from "./tabs/DocumentsTab";
import TimelineTab from "./tabs/TimelineTab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "form58", label: "Form No. 58" },
  { key: "deductions", label: "Deductions" },
  { key: "payment-status", label: "Payment Status" },
  { key: "documents", label: "Documents" },
  { key: "timeline", label: "Timeline" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface Props {
  bill: RunningBill;
  payments: PaymentRegisterRow[];
  onRecordPayment: () => void;
}

export default function RunningBillWorkspace({ bill, payments, onRecordPayment }: Props) {
  const [tab, setTab] = useState<TabKey>("overview");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-xl bg-white p-3 shadow-sm print:hidden">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.key ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "overview" && <OverviewTab bill={bill} />}
        {tab === "form58" && <Form58Tab bill={bill} />}
        {tab === "deductions" && <DeductionsTab bill={bill} />}
        {tab === "payment-status" && <PaymentStatusTab bill={bill} payments={payments} onRecordPayment={onRecordPayment} />}
        {tab === "documents" && <DocumentsTab bill={bill} />}
        {tab === "timeline" && <TimelineTab bill={bill} payments={payments} />}
      </div>
    </div>
  );
}
