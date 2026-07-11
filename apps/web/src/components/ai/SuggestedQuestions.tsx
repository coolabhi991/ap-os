import type { AISuggestion } from "../../services/ai";

interface Props {
  suggestions: AISuggestion[];
  onSelect: (example: string) => void;
}

export default function SuggestedQuestions({ suggestions, onSelect }: Props) {
  if (!suggestions.length) return null;

  const byCategory = suggestions.reduce<Record<string, AISuggestion[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{category}</p>
          <div className="flex flex-wrap gap-2">
            {items.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelect(s.example)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:border-[#D8B44A] hover:bg-[#FCF8EC]"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
