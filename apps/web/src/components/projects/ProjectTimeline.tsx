const timeline = [
  "Project Created",
  "Survey Completed",
  "Foundation Completed",
  "Pipeline Installation",
  "Testing",
  "Handover",
];

export default function ProjectTimeline() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold">
        Timeline
      </h2>

      <div className="space-y-4">
        {timeline.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3"
          >
            <div className="h-3 w-3 rounded-full bg-green-500" />

            <p>{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}