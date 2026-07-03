const activities = [
  "Project 'Water Supply Phase 3' created",
  "Invoice #INV-1023 generated",
  "₹18,50,000 payment received",
  "Purchase Order #PO-201 approved",
  "New employee added",
];

export default function RecentActivity() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

      <h2 className="mb-4 text-xl font-bold">
        Recent Activity
      </h2>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={index}
            className="rounded-lg border border-slate-100 bg-slate-50 p-3"
          >
            {activity}
          </div>
        ))}
      </div>

    </div>
  );
}