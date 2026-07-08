import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function Section({ title, subtitle, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="mt-2 text-sm leading-7 text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
