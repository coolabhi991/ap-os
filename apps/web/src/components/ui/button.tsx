import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-[#D8B44A] text-white hover:bg-[#C89B2C] shadow-[0_10px_30px_rgba(216,180,74,.28)]",

    secondary:
      "bg-white/75 border border-[#ECECEC] text-slate-700 hover:bg-[#FCFAF3] hover:border-[#E8D79E] shadow-sm",

    ghost:
      "bg-transparent text-slate-600 hover:bg-[#F7F8FA]",

    danger:
      "bg-[#E75B5B] text-white hover:bg-[#D84A4A] shadow-[0_10px_30px_rgba(231,91,91,.22)]",
  };

  return (
    <button
      {...props}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-[20px]
        px-6
        py-3.5
        text-sm
        font-semibold
        tracking-wide
        transition-all
        duration-300
        hover:-translate-y-0.5
        active:scale-[0.98]
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}