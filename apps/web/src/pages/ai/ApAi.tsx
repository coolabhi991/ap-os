import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sparkles, Send, Trash2 } from "lucide-react";

import Layout from "../../components/layout/Layout";
import SuggestedQuestions from "../../components/ai/SuggestedQuestions";
import { UserMessage, AssistantMessage } from "../../components/ai/AIMessageBubble";
import { askAI, getAISuggestions } from "../../services/ai";
import type { AIResponse, AISuggestion } from "../../services/ai";

interface Turn {
  id: string;
  role: "user" | "assistant";
  text?: string;
  response?: AIResponse;
}

let turnCounter = 0;
function nextId() {
  turnCounter += 1;
  return `turn-${turnCounter}`;
}

export default function ApAi() {
  const location = useLocation();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [latestAssistantId, setLatestAssistantId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAISuggestions().then(setSuggestions).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  const submit = async (message: string) => {
    const text = message.trim();
    if (!text || asking) return;

    setInput("");
    setTurns((prev) => [...prev, { id: nextId(), role: "user", text }]);
    setAsking(true);
    try {
      const response = await askAI(text);
      const assistantId = nextId();
      setLatestAssistantId(assistantId);
      setTurns((prev) => [...prev, { id: assistantId, role: "assistant", response }]);
    } catch {
      const assistantId = nextId();
      setLatestAssistantId(assistantId);
      setTurns((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", response: { intentId: "error", intentLabel: "Error", summary: "Something went wrong reaching AP AI. Please try again." } },
      ]);
    } finally {
      setAsking(false);
    }
  };

  useEffect(() => {
    const initialQuery = (location.state as { initialQuery?: string } | null)?.initialQuery;
    if (initialQuery) {
      window.history.replaceState({}, "");
      const timer = setTimeout(() => submit(initialQuery), 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  const clearHistory = () => {
    setTurns([]);
    setLatestAssistantId(null);
  };

  return (
    <Layout>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
              <Sparkles className="text-[#D8B44A]" /> AP AI
            </h1>
            <p className="mt-2 text-slate-500">Your AI Operating Layer — ask about projects, bills, cash, and more. Every answer comes straight from AP OS's own data.</p>
          </div>
          {turns.length > 0 && (
            <button onClick={clearHistory} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50">
              <Trash2 className="h-4 w-4" /> Clear
            </button>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-6">
            {turns.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#243247]">
                  <Sparkles size={28} className="text-[#D8B44A]" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-800">Ask AP AI anything about your business.</p>
                  <p className="mt-1 text-sm text-slate-500">Try one of the questions below, or type your own.</p>
                </div>
                <div className="w-full max-w-2xl">
                  <SuggestedQuestions suggestions={suggestions} onSelect={submit} />
                </div>
              </div>
            ) : (
              <>
                {turns.map((t) =>
                  t.role === "user" ? (
                    <UserMessage key={t.id} text={t.text ?? ""} />
                  ) : (
                    <AssistantMessage key={t.id} response={t.response!} animate={t.id === latestAssistantId} />
                  )
                )}
                {asking && (
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#243247]">
                      <Sparkles size={15} className="text-[#D8B44A]" />
                    </div>
                    Thinking...
                  </div>
                )}
              </>
            )}
          </div>

          {turns.length > 0 && (
            <div className="border-t border-slate-100 px-6 py-4">
              <SuggestedQuestions suggestions={suggestions.slice(0, 6)} onSelect={submit} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-3 border-t border-slate-200 p-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AP AI — e.g. “Outstanding Running Bills” or “Show project summary for …”"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#D8B44A]"
            />
            <button
              type="submit"
              disabled={asking || !input.trim()}
              className="flex h-11 items-center gap-2 rounded-xl bg-[#243247] px-5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02] disabled:opacity-50"
            >
              <Send size={16} /> Ask
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
