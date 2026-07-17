import { useEffect, useState } from "react";
import { FilePlus, Pencil, Send, BadgeCheck, Banknote, Paperclip, MailCheck } from "lucide-react";
import type { RunningBill, PaymentRegisterRow } from "../../../services/running-bills";
import { getRunningBillEmailLogs } from "../../../services/running-bills";
import type { RunningBillEmailLog } from "../../../services/running-bills";
import { getDocumentsByRunningBill } from "../../../services/documents";
import type { ProjectDocument } from "../../../services/documents";
import { formatCurrency as inr } from "../../../lib/utils";
import LoadingState from "../../ui/LoadingState";

type EventType = "CREATED" | "EDITED" | "SUBMITTED" | "CERTIFIED" | "PAYMENT_RECEIVED" | "DOCUMENT_UPLOADED" | "EMAIL_SENT";

interface TimelineEvent {
  id: string;
  type: EventType;
  label: string;
  date: string;
}

const ICONS: Record<EventType, typeof FilePlus> = {
  CREATED: FilePlus,
  EDITED: Pencil,
  SUBMITTED: Send,
  CERTIFIED: BadgeCheck,
  PAYMENT_RECEIVED: Banknote,
  DOCUMENT_UPLOADED: Paperclip,
  EMAIL_SENT: MailCheck,
};

const COLORS: Record<EventType, string> = {
  CREATED: "bg-slate-100 text-slate-600",
  EDITED: "bg-amber-100 text-amber-600",
  SUBMITTED: "bg-blue-100 text-blue-600",
  CERTIFIED: "bg-purple-100 text-purple-600",
  PAYMENT_RECEIVED: "bg-emerald-100 text-emerald-600",
  DOCUMENT_UPLOADED: "bg-cyan-100 text-cyan-600",
  EMAIL_SENT: "bg-indigo-100 text-indigo-600",
};

// Purely client-side synthesis over data this Object Page already fetches (or can fetch with the
// same existing service functions) — no dedicated Timeline/ActivityLog model exists in the schema,
// same pattern as the Project Workspace's Timeline tab (project-control-center.service.ts). Email
// Sent is folded in here (rather than a separate section) since the task's 6 sections don't include
// a dedicated Email tab, but the data already existed on the old flat page and is worth keeping.
export default function TimelineTab({ bill, payments }: { bill: RunningBill; payments: PaymentRegisterRow[] }) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [emailLogs, setEmailLogs] = useState<RunningBillEmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDocumentsByRunningBill(bill.id).then(setDocuments).catch(() => {}),
      getRunningBillEmailLogs(bill.id).then(setEmailLogs).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [bill.id]);

  if (loading) return <LoadingState label="Loading timeline..." />;

  const events: TimelineEvent[] = [
    { id: "created", type: "CREATED", label: `Bill "${bill.billNumber}" created`, date: bill.createdAt },
  ];
  if (bill.updatedAt && bill.updatedAt !== bill.createdAt) {
    events.push({ id: "edited", type: "EDITED", label: "Bill edited", date: bill.updatedAt });
  }
  if (bill.submittedAt) {
    events.push({ id: "submitted", type: "SUBMITTED", label: "Bill submitted", date: bill.submittedAt });
  }
  if (bill.passedAt) {
    events.push({ id: "certified", type: "CERTIFIED", label: "Bill certified (Passed)", date: bill.passedAt });
  }
  for (const p of payments) {
    events.push({ id: `payment-${p.id}`, type: "PAYMENT_RECEIVED", label: `Payment received — ${inr(p.amount)} (${p.paymentNumber})`, date: p.paymentDate });
  }
  for (const d of documents) {
    events.push({ id: `doc-${d.id}`, type: "DOCUMENT_UPLOADED", label: `Document uploaded — ${d.fileName || d.documentType}`, date: d.uploadedAt });
  }
  for (const log of emailLogs) {
    events.push({
      id: `email-${log.id}`,
      type: "EMAIL_SENT",
      label: `Emailed to ${log.recipients.map((r) => r.label || r.email).join(", ")}${log.status !== "SENT" ? " (failed)" : ""}`,
      date: log.sentAt,
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Timeline</h2>

      {events.length === 0 ? (
        <p className="mt-6 text-center text-sm text-slate-500">No activity recorded yet.</p>
      ) : (
        <div className="mt-5 space-y-1">
          {events.map((e) => {
            const Icon = ICONS[e.type];
            return (
              <div key={e.id} className="flex items-start gap-3 rounded-lg px-3 py-2.5">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${COLORS[e.type]}`}>
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800">{e.label}</p>
                  <p className="text-xs text-slate-400">{new Date(e.date).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
