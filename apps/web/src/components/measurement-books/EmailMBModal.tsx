import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { sendMBEmail, EMAIL_RECIPIENT_ROLES, EMAIL_RECIPIENT_ROLE_LABELS } from "../../services/measurement-books";
import type { EmailRecipient } from "../../services/measurement-books";

interface Props {
  mbId: string;
  onClose: () => void;
  onSent: () => void;
}

interface RecipientRow extends EmailRecipient {
  role: string;
}

export default function EmailMBModal({ mbId, onClose, onSent }: Props) {
  const [recipients, setRecipients] = useState<RecipientRow[]>([{ role: "EXECUTIVE_ENGINEER", label: "", email: "" }]);
  const [includeExcel, setIncludeExcel] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRow = () => setRecipients((rows) => [...rows, { role: "CUSTOM", label: "", email: "" }]);
  const updateRow = (i: number, patch: Partial<RecipientRow>) => setRecipients((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRow = (i: number) => setRecipients((rows) => rows.filter((_, idx) => idx !== i));

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const r of recipients) {
      if (!r.email.trim()) return setError("Every recipient needs an email address.");
    }
    setSending(true);
    setError(null);
    try {
      await sendMBEmail(mbId, {
        recipients: recipients.map((r) => ({ label: r.label || EMAIL_RECIPIENT_ROLE_LABELS[r.role], email: r.email })),
        includeExcel,
        message: message || undefined,
      });
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Email Measurement Book</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-3">
            {recipients.map((r, i) => (
              <div key={i} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-3">
                <select value={r.role} onChange={(e) => updateRow(i, { role: e.target.value })} className="rounded-lg border p-2">
                  {EMAIL_RECIPIENT_ROLES.map((role) => <option key={role} value={role}>{EMAIL_RECIPIENT_ROLE_LABELS[role]}</option>)}
                </select>
                <input
                  type="email"
                  placeholder="Email address"
                  value={r.email}
                  onChange={(e) => updateRow(i, { email: e.target.value })}
                  required
                  className="rounded-lg border p-2 md:col-span-1"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Display name (optional)"
                    value={r.label}
                    onChange={(e) => updateRow(i, { label: e.target.value })}
                    className="flex-1 rounded-lg border p-2"
                  />
                  <button type="button" onClick={() => removeRow(i)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addRow} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
              <Plus className="h-4 w-4" /> Add Recipient
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={includeExcel} onChange={(e) => setIncludeExcel(e.target.checked)} />
            Also attach Excel (.xlsx)
          </label>

          <div>
            <label className="mb-1 block text-sm font-medium">Message (optional)</label>
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-lg border p-2.5" />
          </div>

          <p className="text-xs text-slate-400">The PDF is always attached automatically.</p>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-5 py-2.5">Cancel</button>
            <button type="submit" disabled={sending} className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60">
              {sending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
