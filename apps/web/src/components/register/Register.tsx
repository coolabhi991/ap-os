import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Copy, Trash2, Pencil, Check, X, Search } from "lucide-react";
import type { RegisterColumn } from "./types";

// Generic Excel/Tally-style Register (Grid). Domain-agnostic — every module-specific concern
// (fields, validation, session-remembered columns, save/update/delete calls) is supplied by the
// caller via props. This file must never import or reference a specific business domain.

interface RegisterProps<T extends object> {
  columns: RegisterColumn<T>[];
  rows: T[];
  emptyRow: () => T;
  onSaveRow: (row: T) => Promise<T>;
  onUpdateRow: (id: string, row: T) => Promise<T>;
  onDeleteRow: (id: string) => Promise<void>;
  rowKey?: (row: T) => string;
  validateRow?: (row: T) => string | null;
  /** Non-null return disables Save for this row and shows the message instead (e.g. an edge case that needs the full form). */
  disableRowReason?: (row: T) => string | null;
  loading?: boolean;
  /** Totals/summary bar, rendered above the grid. Owned entirely by the caller. */
  summary?: React.ReactNode;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

interface DraftRow<T> {
  localId: string;
  data: T;
  saving: boolean;
  error: string | null;
}

let draftCounter = 0;
const nextDraftId = () => `draft-${Date.now()}-${draftCounter++}`;

export default function Register<T extends object>({
  columns,
  rows,
  emptyRow,
  onSaveRow,
  onUpdateRow,
  onDeleteRow,
  rowKey = (row) => String((row as { id?: unknown }).id ?? ""),
  validateRow,
  disableRowReason,
  loading = false,
  summary,
  searchPlaceholder = "Search...",
  emptyMessage = "No rows yet. Click \"Add Row\" to start.",
}: RegisterProps<T>) {
  const [draftRows, setDraftRows] = useState<DraftRow<T>[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<T | null>(null);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [editingSaving, setEditingSaving] = useState(false);
  const [sessionValues, setSessionValues] = useState<Partial<T>>({});
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const containerRef = useRef<HTMLDivElement>(null);

  const hasUnsaved = draftRows.length > 0 || editingId !== null;

  useEffect(() => {
    if (!hasUnsaved) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  const makeDraft = (overrides?: Partial<T>): DraftRow<T> => ({
    localId: nextDraftId(),
    data: { ...emptyRow(), ...sessionValues, ...overrides },
    saving: false,
    error: null,
  });

  const addRow = (overrides?: Partial<T>) => {
    const draft = makeDraft(overrides);
    setDraftRows((prev) => [...prev, draft]);
    requestAnimationFrame(() => focusRow(draft.localId));
    return draft;
  };

  const focusRow = (id: string) => {
    const el = containerRef.current?.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(id)}"] [data-col-index="0"]`);
    el?.focus();
  };

  // Returns the remembered patch synchronously (in addition to scheduling the sessionValues
  // state update) so a same-tick addRow() can apply it immediately — setSessionValues alone
  // wouldn't be visible yet to a addRow() call made later in this same event handler, since
  // React state updates don't apply until the next render.
  const rememberSession = (data: T): Partial<T> => {
    const remembered: Partial<T> = {};
    for (const col of columns) {
      if (col.rememberInSession) remembered[col.key] = data[col.key];
    }
    if (Object.keys(remembered).length > 0) setSessionValues((prev) => ({ ...prev, ...remembered }));
    return remembered;
  };

  const updateDraft = (localId: string, key: keyof T, value: unknown) => {
    setDraftRows((prev) => prev.map((d) => (d.localId === localId ? { ...d, data: { ...d.data, [key]: value }, error: null } : d)));
  };

  const patchDraft = (localId: string, patch: Partial<T>) => {
    setDraftRows((prev) => prev.map((d) => (d.localId === localId ? { ...d, data: { ...d.data, ...patch }, error: null } : d)));
  };

  const removeDraft = (localId: string) => setDraftRows((prev) => prev.filter((d) => d.localId !== localId));

  const saveDraft = async (localId: string, addAnother: boolean) => {
    const draft = draftRows.find((d) => d.localId === localId);
    if (!draft) return;
    const validationError = validateRow?.(draft.data) ?? null;
    if (validationError) {
      setDraftRows((prev) => prev.map((d) => (d.localId === localId ? { ...d, error: validationError } : d)));
      return;
    }
    setDraftRows((prev) => prev.map((d) => (d.localId === localId ? { ...d, saving: true, error: null } : d)));
    try {
      const saved = await onSaveRow(draft.data);
      const remembered = rememberSession(saved);
      removeDraft(localId);
      if (addAnother) addRow(remembered);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save row.";
      setDraftRows((prev) => prev.map((d) => (d.localId === localId ? { ...d, saving: false, error: message } : d)));
    }
  };

  const duplicateRow = (data: T) => {
    const clone = { ...data } as Partial<T> & { id?: unknown };
    delete clone.id;
    addRow(clone as Partial<T>);
  };

  const startEdit = (row: T) => {
    setEditingId(rowKey(row));
    setEditingData({ ...row });
    setEditingError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
    setEditingError(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editingData) return;
    const validationError = validateRow?.(editingData) ?? null;
    if (validationError) {
      setEditingError(validationError);
      return;
    }
    setEditingSaving(true);
    setEditingError(null);
    try {
      const saved = await onUpdateRow(editingId, editingData);
      rememberSession(saved);
      cancelEdit();
    } catch (err) {
      setEditingError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setEditingSaving(false);
    }
  };

  const handleDelete = async (row: T) => {
    if (!window.confirm("Delete this row?")) return;
    await onDeleteRow(rowKey(row));
    if (editingId === rowKey(row)) cancelEdit();
  };

  // Search + filter + sort over saved rows only — draft rows always show, unfiltered, at the bottom.
  const visibleRows = useMemo(() => {
    let result = rows;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          if (col.searchable === false) return false;
          const raw = row[col.key];
          if (col.type === "select" && col.options) {
            const label = col.options.find((o) => o.value === raw)?.label ?? "";
            return label.toLowerCase().includes(term);
          }
          return String(raw ?? "").toLowerCase().includes(term);
        })
      );
    }
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue;
      result = result.filter((row) => String(row[key as keyof T] ?? "") === value);
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      result = [...result].sort((a, b) => {
        const av = a[sortKey as keyof T];
        const bv = b[sortKey as keyof T];
        const cmp = col?.type === "number" ? Number(av ?? 0) - Number(bv ?? 0) : String(av ?? "").localeCompare(String(bv ?? ""));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [rows, search, filters, sortKey, sortDir, columns]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // Arrow-key row navigation: Up/Down jumps to the same column in the adjacent row.
  const handleGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    const target = e.target as HTMLElement;
    const cell = target.closest<HTMLElement>("[data-col-index]");
    const rowEl = target.closest<HTMLElement>("[data-row-id]");
    if (!cell || !rowEl || !containerRef.current) return;
    const colIndex = cell.getAttribute("data-col-index");
    const allRows = Array.from(containerRef.current.querySelectorAll<HTMLElement>("[data-row-id]"));
    const currentIndex = allRows.indexOf(rowEl);
    const nextRow = e.key === "ArrowDown" ? allRows[currentIndex + 1] : allRows[currentIndex - 1];
    if (!nextRow) return;
    const nextCell = nextRow.querySelector<HTMLElement>(`[data-col-index="${colIndex}"]`);
    if (nextCell) {
      e.preventDefault();
      nextCell.focus();
    }
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, onEnter: () => void) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      e.preventDefault();
      onEnter();
    } else if (e.key === "Escape") {
      (e.target as HTMLElement).blur();
    }
  };

  const inputClass = "w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  function renderInput(col: RegisterColumn<T>, value: unknown, onChange: (v: unknown) => void, colIndex: number, autoFocus?: boolean) {
    const common = {
      "data-col-index": colIndex,
      autoFocus,
      className: inputClass,
    };
    if (col.type === "select") {
      return (
        <select {...common} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          <option value="">{col.placeholder ?? `Select ${col.label}`}</option>
          {col.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }
    if (col.type === "textarea") {
      return <textarea {...common} rows={1} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={col.placeholder} />;
    }
    if (col.type === "number") {
      return (
        <input
          {...common}
          type="number"
          step="0.01"
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={col.placeholder}
        />
      );
    }
    if (col.type === "date") {
      return <input {...common} type="date" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    }
    return <input {...common} type="text" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={col.placeholder} />;
  }

  return (
    <div className="space-y-4" ref={containerRef} onKeyDownCapture={handleGridKeyDown}>
      {summary}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-56 rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          {columns.filter((c) => c.filterable).map((col) => (
            <select
              key={col.key}
              value={filters[col.key] ?? ""}
              onChange={(e) => setFilters((prev) => ({ ...prev, [col.key]: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">{`All ${col.label}`}</option>
              {col.options?.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ))}
        </div>
        <button
          onClick={() => addRow()}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Add Row
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`cursor-pointer whitespace-nowrap px-3 py-2.5 text-left font-medium text-slate-600 select-none ${col.width ?? ""}`}
                  onClick={() => toggleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key && <span className="ml-1 text-xs">{sortDir === "asc" ? "▲" : "▼"}</span>}
                </th>
              ))}
              <th className="w-40 px-3 py-2.5 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            )}

            {!loading && visibleRows.length === 0 && draftRows.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-500">{emptyMessage}</td></tr>
            )}

            {!loading && visibleRows.map((row) => {
              const key = rowKey(row);
              const isEditing = editingId === key;
              return (
                <tr key={key} data-row-id={key} className={`border-t ${isEditing ? "bg-blue-50/50" : "hover:bg-slate-50"}`} onKeyDown={(e) => isEditing && handleRowKeyDown(e, saveEdit)}>
                  {columns.map((col, colIndex) => (
                    <td key={col.key} className={`px-3 py-2 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}>
                      {isEditing && col.editable !== false && editingData
                        ? col.renderEditor?.({
                            row: editingData,
                            value: editingData[col.key],
                            onChange: (v) => setEditingData((d) => (d ? { ...d, [col.key]: v } : d)),
                            onRowChange: (patch) => setEditingData((d) => (d ? { ...d, ...patch } : d)),
                            autoFocus: colIndex === 0,
                          }) ?? renderInput(col, editingData[col.key], (v) => setEditingData((d) => (d ? { ...d, [col.key]: v } : d)), colIndex, colIndex === 0)
                        : col.render
                        ? col.render(row[col.key], row)
                        : <span className="text-slate-700">{String(row[col.key] ?? "") || "—"}</span>}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-1.5">
                        <button onClick={saveEdit} disabled={editingSaving} title="Save" className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={cancelEdit} title="Cancel" className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => startEdit(row)} title="Edit" className="rounded p-1.5 text-blue-600 hover:bg-blue-50">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => duplicateRow(row)} title="Duplicate" className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
                          <Copy className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(row)} title="Delete" className="rounded p-1.5 text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {draftRows.map((draft) => {
              const reason = disableRowReason?.(draft.data) ?? null;
              const message = draft.error || reason;
              return (
                <Fragment key={draft.localId}>
                  <tr data-row-id={draft.localId} className="border-t bg-amber-50/40" onKeyDown={(e) => handleRowKeyDown(e, () => saveDraft(draft.localId, true))}>
                    {columns.map((col, colIndex) => (
                      <td key={col.key} className={`px-3 py-2 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}>
                        {col.editable === false
                          ? <span className="text-slate-500">{String(draft.data[col.key] ?? "") || "—"}</span>
                          : col.renderEditor?.({
                              row: draft.data,
                              value: draft.data[col.key],
                              onChange: (v) => updateDraft(draft.localId, col.key, v),
                              onRowChange: (patch) => patchDraft(draft.localId, patch),
                              autoFocus: colIndex === 0,
                            }) ?? renderInput(col, draft.data[col.key], (v) => updateDraft(draft.localId, col.key, v), colIndex, colIndex === 0)}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => saveDraft(draft.localId, false)}
                          disabled={draft.saving || !!reason}
                          title="Save Row"
                          className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => duplicateRow(draft.data)} title="Duplicate" className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
                          <Copy className="h-4 w-4" />
                        </button>
                        <button onClick={() => removeDraft(draft.localId)} title="Delete Row" className="rounded p-1.5 text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {message && (
                    <tr>
                      <td colSpan={columns.length + 1} className="px-3 pb-2 pt-0 text-xs text-red-600">{message}</td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {draftRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => draftRows[draftRows.length - 1] && saveDraft(draftRows[draftRows.length - 1].localId, true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save &amp; Add Another
          </button>
          <span className="text-xs text-slate-400">Enter = Save Row · ↑/↓ = move between rows · Tab = next field</span>
        </div>
      )}

      {editingError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{editingError}</div>}
    </div>
  );
}
