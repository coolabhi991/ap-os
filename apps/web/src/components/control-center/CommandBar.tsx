import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Send } from "lucide-react";

const EXAMPLES = [
  "Show pending vendor payments",
  "Open JJM Project",
  "Today's site expenses",
  "Bills awaiting payment",
];

export default function CommandBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const ask = (text: string) => {
    const message = text.trim();
    if (!message) return;
    navigate("/ai", { state: { initialQuery: message } });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(query);
  };

  return (
    <div className="sticky bottom-0 rounded-2xl border border-[#F2E2AE] bg-gradient-to-r from-[#FCF8EC] to-white p-4 shadow-lg">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#243247] shadow-md">
          <Sparkles size={18} className="text-[#D8B44A]" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask AP OS anything..."
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#243247] px-4 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02] disabled:opacity-50"
        >
          <Send size={15} /> Ask
        </button>
      </form>

      <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-[52px]">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => ask(ex)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 hover:border-[#D8B44A] hover:text-slate-700"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
