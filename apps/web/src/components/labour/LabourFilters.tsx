import { LABOUR_CATEGORY_LABELS } from "../../services/labour";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  projectFilter: string;
  onProjectChange: (v: string) => void;
  projects: { id: string; name: string }[];
  contractorFilter: string;
  onContractorChange: (v: string) => void;
  contractors: { id: string; name: string }[];
  groupFilter: string;
  onGroupChange: (v: string) => void;
  groups: { id: string; name: string }[];
  categoryFilter: string;
  onCategoryChange: (v: string) => void;
}

export default function LabourFilters({
  search, onSearchChange,
  projectFilter, onProjectChange, projects,
  contractorFilter, onContractorChange, contractors,
  groupFilter, onGroupChange, groups,
  categoryFilter, onCategoryChange,
}: Props) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        <input
          type="text"
          placeholder="Search name, phone, designation..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-lg border p-3 outline-none focus:border-blue-500"
        />
        <select value={projectFilter} onChange={(e) => onProjectChange(e.target.value)} className="rounded-lg border p-3 outline-none focus:border-blue-500">
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={contractorFilter} onChange={(e) => onContractorChange(e.target.value)} className="rounded-lg border p-3 outline-none focus:border-blue-500">
          <option value="">All Contractors</option>
          {contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={groupFilter} onChange={(e) => onGroupChange(e.target.value)} className="rounded-lg border p-3 outline-none focus:border-blue-500">
          <option value="">All Groups</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => onCategoryChange(e.target.value)} className="rounded-lg border p-3 outline-none focus:border-blue-500">
          <option value="">All Categories</option>
          {Object.entries(LABOUR_CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
