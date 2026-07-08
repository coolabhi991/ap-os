interface ProjectStatsProps {
  contractValue: number;
  progress: number;
  manager: string;
  startDate: string;
  endDate: string;
}

export default function ProjectStats({
  contractValue,
  progress,
  manager,
  startDate,
  endDate,
}: ProjectStatsProps) {
  const cards = [
    {
      title: "Contract Value",
      value: `₹${contractValue} Cr`,
      subtitle: "Total Project Value",
    },
    {
      title: "Progress",
      value: `${progress}%`,
      subtitle: "Current Progress",
    },
    {
      title: "Project Manager",
      value: manager,
      subtitle: "Responsible Person",
    },
    {
      title: "Timeline",
      value: `${startDate} → ${endDate}`,
      subtitle: "Project Duration",
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        >
          <p className="text-sm font-medium text-slate-500">
            {card.title}
          </p>

          <h2 className="mt-3 text-3xl font-bold text-slate-900">
            {card.value}
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {card.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
}