import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderPlus, MapPin, Receipt, FileText, Banknote, Paperclip } from "lucide-react";
import { getProjectTimeline } from "../../../services/projects";
import type { ProjectTimelineEvent, ProjectTimelineEventType } from "../../../services/projects";
import LoadingState from "../../ui/LoadingState";

const ICONS: Record<ProjectTimelineEventType, typeof FolderPlus> = {
  PROJECT_CREATED: FolderPlus,
  SITE_ADDED: MapPin,
  EXPENSE_ADDED: Receipt,
  RUNNING_BILL_SUBMITTED: FileText,
  PAYMENT_RECEIVED: Banknote,
  DOCUMENT_UPLOADED: Paperclip,
};

const COLORS: Record<ProjectTimelineEventType, string> = {
  PROJECT_CREATED: "bg-slate-100 text-slate-600",
  SITE_ADDED: "bg-blue-100 text-blue-600",
  EXPENSE_ADDED: "bg-amber-100 text-amber-600",
  RUNNING_BILL_SUBMITTED: "bg-purple-100 text-purple-600",
  PAYMENT_RECEIVED: "bg-emerald-100 text-emerald-600",
  DOCUMENT_UPLOADED: "bg-cyan-100 text-cyan-600",
};

export default function TimelineTab({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ProjectTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getProjectTimeline(projectId)
      .then(setEvents)
      .catch(() => setError("Failed to load timeline."))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <LoadingState label="Loading timeline..." />;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

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
              <div
                key={e.id}
                onClick={() => e.link && navigate(e.link)}
                className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${e.link ? "cursor-pointer hover:bg-slate-50" : ""}`}
              >
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
