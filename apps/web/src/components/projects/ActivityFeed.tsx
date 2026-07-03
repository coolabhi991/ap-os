const activities = [
  "Bill #102 generated",
  "Purchase Order approved",
  "Engineer assigned",
  "Site inspection completed",
];

export default function ActivityFeed() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold">
        Recent Activity
      </h2>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={index}
            className="rounded-lg bg-slate-50 p-3"
          >
            {activity}
          </div>
        ))}
      </div>
    </div>
  );
}