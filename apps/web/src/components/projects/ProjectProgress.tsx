interface ProjectProgressProps {
  percentage: number;
}

export default function ProjectProgress({
  percentage,
}: ProjectProgressProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold">
        Project Progress
      </h2>

      <div className="mb-3 flex justify-between">
        <span className="text-slate-500">
          Completion
        </span>

        <span className="font-semibold">
          {percentage}%
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}