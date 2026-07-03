export default function QuickActions() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold">
        Quick Actions
      </h2>

      <div className="grid gap-3">
        <button className="rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700">
          Edit Project
        </button>

        <button className="rounded-lg bg-green-600 py-3 text-white hover:bg-green-700">
          Generate Invoice
        </button>

        <button className="rounded-lg bg-orange-500 py-3 text-white hover:bg-orange-600">
          Purchase Order
        </button>

        <button className="rounded-lg bg-slate-800 py-3 text-white hover:bg-black">
          Upload Document
        </button>
      </div>
    </div>
  );
}