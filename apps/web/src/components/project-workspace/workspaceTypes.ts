import type { ComponentType } from "react";

export interface WorkspaceSummaryStat {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  trend?: string;
}
