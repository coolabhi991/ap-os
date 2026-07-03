interface ProjectInfoProps {
  projectName: string;
  status: string;
  client: string;
  manager: string;
  budget: string;
  spent: string;
  startDate: string;
  endDate: string;
}

export default function ProjectInfo({
  projectName,
  status,
  client,
  manager,
  budget,
  spent,
  startDate,
  endDate,
}: ProjectInfoProps) {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {projectName}
          </h1>

          <p className="mt-2 text-slate-500">
            Construction Project Overview
          </p>
        </div>

        <span
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            status === "Running"
              ? "bg-green-100 text-green-700"
              : status === "Planning"
              ? "bg-blue-100 text-blue-700"
              : status === "Completed"
              ? "bg-gray-100 text-gray-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm text-slate-500">Client</p>
          <p className="mt-1 font-semibold">{client}</p>
        </div>

        <div>
          <p className="text-sm text-slate-500">Project Manager</p>
          <p className="mt-1 font-semibold">{manager}</p>
        </div>

        <div>
          <p className="text-sm text-slate-500">Start Date</p>
          <p className="mt-1 font-semibold">{startDate}</p>
        </div>

        <div>
          <p className="text-sm text-slate-500">End Date</p>
          <p className="mt-1 font-semibold">{endDate}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Project Budget</p>

          <h2 className="mt-2 text-3xl font-bold text-blue-600">
            {budget}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Amount Spent</p>

          <h2 className="mt-2 text-3xl font-bold text-red-600">
            {spent}
          </h2>
        </div>
      </div>
    </div>
  );
}