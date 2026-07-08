import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`
        rounded-[30px]
        border
        border-white/70
        bg-white/70
        backdrop-blur-2xl
        shadow-[0_12px_40px_rgba(15,23,42,0.08)]
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-[0_20px_60px_rgba(15,23,42,0.12)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}