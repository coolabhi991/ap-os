// Generic Excel/Tally-style Register (Grid) component — reusable across any fast-entry module
// (Expenses today; Vendor Bills, Vendor Payments, Purchase Orders, Material Receipts, Employee
// Transactions, RA Bills later). Nothing in this file or Register.tsx may reference "expense" —
// all domain shape comes from the caller via RegisterColumn<T> definitions.

export type RegisterColumnType = "text" | "number" | "date" | "select" | "textarea";

export interface RegisterSelectOption {
  value: string;
  label: string;
}

export interface RegisterColumn<T> {
  /** Key into the row object this column reads/writes. */
  key: keyof T & string;
  label: string;
  type: RegisterColumnType;
  /** Tailwind width class, e.g. "w-32". Omit to let the column size naturally. */
  width?: string;
  options?: RegisterSelectOption[];
  required?: boolean;
  align?: "left" | "right" | "center";
  /** Read-only display override for saved (non-editing) rows. Defaults to String(value). */
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  /** Custom editable cell — takes over the input entirely (e.g. a conditional sub-field). Return null to fall back to the default input for this column type. */
  renderEditor?: (props: RegisterEditorProps<T>) => React.ReactNode | null;
  /** Remembered across rows within the same entry session (e.g. Category, Vendor, Payment Mode). */
  rememberInSession?: boolean;
  /** Included in the free-text search match. Defaults to true for text/select columns. */
  searchable?: boolean;
  /** Adds a column-level filter dropdown (select columns only). */
  filterable?: boolean;
  /** Column cannot be edited inline (e.g. a computed/derived value). */
  editable?: boolean;
  placeholder?: string;
}

export interface RegisterEditorProps<T> {
  row: T;
  value: T[keyof T];
  onChange: (value: T[keyof T]) => void;
  /** Updates multiple fields on the row at once — for a custom editor that drives a sibling column (e.g. Payment Mode revealing a Bank Account picker). */
  onRowChange: (patch: Partial<T>) => void;
  autoFocus?: boolean;
  onKeyDownCapture?: (e: React.KeyboardEvent) => void;
}

export interface RegisterRowState {
  saving?: boolean;
  error?: string | null;
}
