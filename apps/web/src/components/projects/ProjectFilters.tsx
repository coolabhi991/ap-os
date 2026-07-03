interface ProjectFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function ProjectFilters({
  search,
  onSearchChange,
}: ProjectFiltersProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search project..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
        />

        <select className="rounded-lg border border-slate-300 px-4 py-3">
          <option>All Status</option>
          <option>Planning</option>
          <option>Running</option>
          <option>Completed</option>
          <option>On Hold</option>
        </select>
      </div>
    </div>
  );
}