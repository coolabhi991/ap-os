import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

      <div>

        <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">

          <span>AP Construction</span>

          <ChevronRight size={15} />

          <span>Operating System</span>

        </div>

        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-2 max-w-2xl text-base leading-7 text-slate-500">
            {subtitle}
          </p>
        )}

      </div>

      {action && (
        <div className="flex items-center">
          {action}
        </div>
      )}

    </div>
  );
}