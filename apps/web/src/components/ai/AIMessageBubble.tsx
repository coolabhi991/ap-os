import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, User, FolderKanban, Receipt, Building2, Ruler, NotebookPen, ArrowUpRight } from "lucide-react";
import type { AIResponse, AILink, AITone } from "../../services/ai";

const LINK_ICONS: Record<AILink["kind"], typeof FolderKanban> = {
  project: FolderKanban,
  "running-bill": Receipt,
  vendor: Building2,
  "measurement-book": Ruler,
  dpr: NotebookPen,
  generic: ArrowUpRight,
};

const TONE_STYLES: Record<AITone, string> = {
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  negative: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

/** Simulated streaming — AP AI's answers are computed synchronously from existing services (there is no token-by-token model output to relay), so this reveals the already-known summary progressively for a "live" feel. */
function useStreamedText(text: string, enabled: boolean) {
  const [revealed, setRevealed] = useState(enabled ? "" : text);
  const [done, setDone] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return;
    setRevealed("");
    setDone(false);
    let i = 0;
    const step = Math.max(1, Math.round(text.length / 60));
    const interval = setInterval(() => {
      i += step;
      if (i >= text.length) {
        setRevealed(text);
        setDone(true);
        clearInterval(interval);
      } else {
        setRevealed(text.slice(0, i));
      }
    }, 12);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, enabled]);

  return { revealed, done };
}

function AICards({ cards }: { cards: NonNullable<AIResponse["cards"]> }) {
  if (!cards.length) return null;
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {cards.map((c, i) => (
        <div key={i} className={`rounded-xl border px-3 py-2 ${TONE_STYLES[c.tone ?? "neutral"]}`}>
          <p className="text-[11px] font-medium uppercase tracking-wide opacity-70">{c.label}</p>
          <p className="mt-0.5 text-sm font-bold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function AITableView({ table }: { table: NonNullable<AIResponse["table"]> }) {
  if (!table.rows.length) return null;
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {table.columns.map((c) => (
              <th key={c.key} className={`px-3 py-2 font-medium text-slate-600 ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className="border-t border-slate-100">
              {table.columns.map((c) => (
                <td key={c.key} className={`px-3 py-2 ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"}`}>
                  {row[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AILinksRow({ links }: { links: AILink[] }) {
  const navigate = useNavigate();
  if (!links.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((l, i) => {
        const Icon = LINK_ICONS[l.kind];
        return (
          <button
            key={i}
            onClick={() => navigate(l.href)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-[#D8B44A] hover:text-[#B98A1F]"
          >
            <Icon size={13} /> {l.label}
          </button>
        );
      })}
    </div>
  );
}

export function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex items-start justify-end gap-3">
      <div className="max-w-xl rounded-2xl rounded-tr-sm bg-[#243247] px-4 py-3 text-sm text-white shadow-sm">{text}</div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
        <User size={16} className="text-slate-500" />
      </div>
    </div>
  );
}

export function AssistantMessage({ response, animate = false }: { response: AIResponse; animate?: boolean }) {
  const { revealed, done } = useStreamedText(response.summary, animate);

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#243247]">
        <Sparkles size={15} className="text-[#D8B44A]" />
      </div>
      <div className="max-w-2xl rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-sm text-slate-800">
          {revealed}
          {!done && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-slate-400 align-middle" />}
        </p>
        {done && response.cards && <AICards cards={response.cards} />}
        {done && response.table && <AITableView table={response.table} />}
        {done && response.links && <AILinksRow links={response.links} />}
      </div>
    </div>
  );
}
