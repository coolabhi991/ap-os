interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  projectFilter: string;
  onProjectChange: (v: string) => void;
  projects: { id: string; name: string }[];
  materialFilter: string;
  onMaterialChange: (v: string) => void;
  materials: { id: string; itemName: string }[];
  fromDate: string;
  onFromDateChange: (v: string) => void;
  toDate: string;
  onToDateChange: (v: string) => void;
}

export default function MaterialIssueFilters({
  search, onSearchChange,
  projectFilter, onProjectChange, projects,
  materialFilter, onMaterialChange, materials,
  fromDate, onFromDateChange,
  toDate, onToDateChange,
}: Props) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        <input
          type="text"
          placeholder="Search issue no., purpose, issued to..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-lg border p-3 outline-none focus:border-blue-500"
        />

        <select value={projectFilter} onChange={(e) => onProjectChange(e.target.value)} className="rounded-lg border p-3 outline-none focus:border-blue-500">
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select value={materialFilter} onChange={(e) => onMaterialChange(e.target.value)} className="rounded-lg border p-3 outline-none focus:border-blue-500">
          <option value="">All Materials</option>
          {materials.map((m) => <option key={m.id} value={m.id}>{m.itemName}</option>)}
        </select>

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
