import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import Card from "./Card";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: StatCardProps) {
  return (
    <Card className="group overflow-hidden p-5">

      <div className="flex items-start justify-between">

        {/* Left */}

        <div className="flex-1">

          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {title}
          </p>

          <h2 className="mt-2 text-[34px] font-bold leading-none tracking-tight text-slate-900">
            {value}
          </h2>

          {subtitle && (
            <p className="mt-2 text-xs text-slate-400">
              {subtitle}
            </p>
          )}

        </div>

        {/* Icon */}

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#F2E2AE] bg-[#FCF8EC] transition-all duration-300 group-hover:scale-105">

          <div className="text-[#B98A1F]">
            {icon}
          </div>

        </div>

      </div>

      {trend && (

        <div className="mt-5 flex items-center justify-between">

          <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5">

            <ArrowUpRight
              size={14}
              className="text-emerald-600"
            />

            <span className="text-xs font-semibold text-emerald-600">
              {trend}
            </span>

          </div>

          <div className="h-1.5 w-14 rounded-full bg-[#EFE5BE]">

            <div className="h-1.5 w-9 rounded-full bg-[#D8B44A]" />

          </div>

        </div>

      )}

    </Card>
  );
}