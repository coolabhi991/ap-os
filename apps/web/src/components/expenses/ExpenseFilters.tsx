import { PAYMENT_MODE_LABELS } from "../../services/expenses";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  projectFilter: string;
  onProjectChange: (v: string) => void;
  projects: { id: string; name: string }[];
  vendorFilter: string;
  onVendorChange: (v: string) => void;
  vendors: { id: string; name: string }[];
  categoryFilter: string;
  onCategoryChange: (v: string) => void;
  categories: { id: string; name: string }[];
  modeFilter: string;
  onModeChange: (v: string) => void;
  fromDate: string;
  onFromDateChange: (v: string) => void;
  toDate: string;
  onToDateChange: (v: string) => void;
  minAmount: string;
  onMinAmountChange: (v: string) => void;
  maxAmount: string;
  onMaxAmountChange: (v: string) => void;
}

export default function ExpenseFilters({
  search, onSearchChange,
  projectFilter, onProjectChange, projects,
  vendorFilter, onVendorChange, vendors,
  categoryFilter, onCategoryChange, categories,
  modeFilter, onModeChange,
  fromDate, onFromDateChange,
  toDate, onToDateChange,
  minAmount, onMinAmountChange,
  maxAmount, onMaxAmountChange,
}: Props) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        <input
          type="text"
          placeholder="Search expense no., description..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-lg border p-3 outline-none focus:border-blue-500"
        />

        <select value={projectFilter} onChange={(e) => onProjectChange(e.target.value)} className="rounded-lg border p-3 outline-none focus:border-blue-500">
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select value={categoryFilter} onChange={(e) => onCategoryChange(e.target.value)} className="rounded-lg border p-3 outline-none focus:border-blue-500">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={vendorFilter} onChange={(e) => onVendorChange(e.target.value)} className="rounded-lg border p-3 outline-none focus:border-blue-500">
          <option value="">All Vendors</option>
          {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>

        <select value={modeFilter} onChange={(e) => onModeChange(e.target.value)} className="rounded-lg border p-3 outline-none focus:border-blue-500">
          <option value="">All Payment Modes</option>
          {Object.entries(PAYMENT_MODE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min ₹" value={minAmount} onChange={(e) => onMinAmountChange(e.target.value)} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500" />
          <input type="number" placeholder="Max ₹" value={maxAmount} onChange={(e) => onMaxAmountChange(e.target.value)} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500" />
        </div>

        <div className="flex items-center gap-2 md:col-span-3">
          <label className="whitespace-nowrap text-sm text-slate-500">From</label>
          <input type="date" value={fromDate} onChange={(e) => onFromDateChange(e.target.value)} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500" />
          <label className="whitespace-nowrap text-sm text-slate-500">To</label>
          <input type="date" value={toDate} onChange={(e) => onToDateChange(e.target.value)} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500" />
        </div>
      </div>
    </div>
  );
}
