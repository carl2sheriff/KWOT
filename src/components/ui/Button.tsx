"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-zinc-100 text-zinc-900 hover:bg-white",
  secondary: "bg-surface-overlay text-zinc-300 border border-zinc-800/50 hover:border-zinc-700 hover:text-zinc-100",
  accent: "bg-accent text-white hover:bg-accent-hover shadow-glow",
  ghost: "bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50",
  danger: "bg-danger/10 text-danger hover:bg-danger hover:text-white",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3.5 py-2 min-h-[32px] text-xs",
  md: "px-5 py-2.5 min-h-[40px] text-sm",
  lg: "px-6 py-3 min-h-[44px] text-sm",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          "rounded-lg font-medium transition-all duration-150 inline-flex items-center justify-center gap-2",
          variantStyles[variant],
          sizeStyles[size],
          isDisabled ? "opacity-40 cursor-not-allowed" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
