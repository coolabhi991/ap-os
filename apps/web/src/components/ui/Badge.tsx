interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "neutral";
}

export default function Badge({
  children,
  variant = "neutral",
}: BadgeProps) {
  const styles = {
    success:
      "bg-emerald-100 text-emerald-700 border border-emerald-200",

    warning:
      "bg-amber-100 text-amber-700 border border-amber-200",

    danger:
      "bg-red-100 text-red-700 border border-red-200",

    info:
      "bg-sky-100 text-sky-700 border border-sky-200",

    neutral:
      "bg-slate-100 text-slate-700 border border-slate-200",
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-3
        py-1
        text-xs
        font-semibold
        tracking-wide
        ${styles[variant]}
      `}
    >
      {children}
    </span>
  );
}