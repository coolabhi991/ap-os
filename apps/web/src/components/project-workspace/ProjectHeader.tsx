interface ProjectHeaderProps {
  name: string;
  code: string;
  client: string;
  status: string;
}

export default function ProjectHeader({
  name,
  code,
  client,
  status,
}: ProjectHeaderProps) {
  const statusColor =
    status === "Running"
      ? "bg-emerald-500"
      : status === "Completed"
      ? "bg-blue-500"
      : status === "Planning"
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">
            Project Workspace
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            {name}
          </h1>

          <div className="mt-3 flex items-center gap-4 text-slate-500">
            <span>{code}</span>

            <span>•</span>

            <span>{client}</span>
          </div>
        </div>

        <div
          className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2"
        >
          <div className={`h-3 w-3 rounded-full ${statusColor}`} />

          <span className="font-medium">
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}