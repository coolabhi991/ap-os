import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

/** Placeholder only — no AI backend is wired up yet. Submitting just shows a "coming soon" note. */
export default function ApAiSearchBox() {
  const [query, setQuery] = useState("");
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowComingSoon(true);
  };

  return (
    <div className="rounded-[28px] border border-[#F2E2AE] bg-gradient-to-r from-[#FCF8EC] to-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#243247] shadow-md">
          <Sparkles size={20} className="text-[#D8B44A]" />
        </div>
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowComingSoon(false); }}
            placeholder="Ask AP AI — e.g. “Which projects are over budget this month?”"
            className="w-full bg-transparent text-base font-medium text-slate-800 outline-none placeholder:text-slate-400"
          />
          {showComingSoon && (
            <p className="mt-1 text-xs text-[#B98A1F]">AP AI is coming soon — this is a placeholder for now.</p>
          )}
        </div>
        <button
          type="submit"
          className="flex h-11 items-center gap-2 rounded-xl bg-[#243247] px-5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02]"
        >
          Ask AP AI <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}
