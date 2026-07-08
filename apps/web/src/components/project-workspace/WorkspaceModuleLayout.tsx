import type { ReactNode } from "react";
import PageHeader from "../ui/PageHeader";
import StatCard from "../ui/StatCard";
import type { WorkspaceSummaryStat } from "./workspaceTypes";

interface WorkspaceModuleLayoutProps {
  title: string;
  subtitle: string;
  summaryStats?: WorkspaceSummaryStat[];
  children: ReactNode;
}

export default function WorkspaceModuleLayout({
  title,
  subtitle,
  summaryStats = [],
  children,
}: WorkspaceModuleLayoutProps) {
  return (
    <div className="flex-1 space-y-6">
      <PageHeader title={title} subtitle={subtitle} />

      {summaryStats.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <StatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                subtitle={stat.subtitle}
                icon={<Icon size={20} />}
                trend={stat.trend}
              />
            );
          })}
        </div>
      )}

      {children}
    </div>
  );
}
