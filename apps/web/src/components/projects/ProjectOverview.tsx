import { useNavigate, useParams } from "react-router-dom";

interface Props {
  name: string;
  code: string;
  client: string;
  manager: string;
  status: string;
  contractValue: number;
  spent: number;
  progress: number;
  startDate: string;
  endDate: string;
}

export default function ProjectOverview({
  name,
  code,
  client,
  manager,
  status,
  contractValue,
  spent,
  progress,
  startDate,
  endDate,
}: Props) {
  const navigate = useNavigate();
  const { id } = useParams();

  const balance = (contractValue - spent).toFixed(2);

  return (
    <div className="space-y-6">

      {/* Project Header */}
      <div className="rounded-xl bg-white p-8 shadow-sm">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {name}
            </h1>

            <p className="mt-2 text-slate-500">
              {code}
            </p>
          </div>

          <span className="rounded-full bg-green-100 px-4 py-2 font-medium text-green-700">
            {status}
          </span>

        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">

          <div>
            <p className="text-sm text-slate-500">
              Client
            </p>

            <h3 className="font-semibold">
              {client}
            </h3>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Project Manager
            </p>

            <h3 className="font-semibold">
              {manager}
            </h3>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Start Date
            </p>

            <h3 className="font-semibold">
              {startDate}
            </h3>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              End Date
            </p>

            <h3 className="font-semibold">
              {endDate}
            </h3>
          </div>

        </div>

      </div>

      {/* Summary Cards */}

      <div className="grid gap-6 md:grid-cols-4">

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-slate-500">
            Contract Value
          </p>

          <h2 className="mt-2 text-3xl font-bold text-blue-600">
            ₹{contractValue} Cr
          </h2>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-slate-500">
            Amount Spent
          </p>

          <h2 className="mt-2 text-3xl font-bold text-red-600">
            ₹{spent} Cr
          </h2>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-slate-500">
            Balance
          </p>

          <h2 className="mt-2 text-3xl font-bold text-green-600">
            ₹{balance} Cr
          </h2>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-slate-500">
            Progress
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {progress}%
          </h2>
        </div>

      </div>

      {/* Progress */}

      <div className="rounded-xl bg-white p-6 shadow-sm">

        <div className="mb-3 flex items-center justify-between">

          <span className="font-medium">
            Project Progress
          </span>

          <span className="font-semibold">
            {progress}%
          </span>

        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-200">

          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

      {/* Quick Actions */}

      <div className="rounded-xl bg-white p-6 shadow-sm">

        <h2 className="mb-5 text-xl font-bold">
          Quick Actions
        </h2>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">

          <button
            onClick={() => navigate(`/projects/${id}/edit`)}
            className="rounded-lg border p-4 hover:bg-slate-50"
          >
            ✏️
            <p className="mt-2 font-medium">
              Edit
            </p>
          </button>

          <button
            onClick={() => navigate(`/projects/${id}/documents`)}
            className="rounded-lg border p-4 hover:bg-slate-50"
          >
            📄
            <p className="mt-2 font-medium">
              Documents
            </p>
          </button>

          <button
            className="rounded-lg border p-4 hover:bg-slate-50"
          >
            💰
            <p className="mt-2 font-medium">
              Billing
            </p>
          </button>

          <button
            className="rounded-lg border p-4 hover:bg-slate-50"
          >
            🛒
            <p className="mt-2 font-medium">
              Purchase
            </p>
          </button>

          <button
            className="rounded-lg border p-4 hover:bg-slate-50"
          >
            📷
            <p className="mt-2 font-medium">
              Photos
            </p>
          </button>

          <button
            className="rounded-lg border p-4 hover:bg-slate-50"
          >
            📝
            <p className="mt-2 font-medium">
              DPR
            </p>
          </button>

        </div>

      </div>

    </div>
  );
}