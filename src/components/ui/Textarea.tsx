"use client";

import React, { forwardRef } from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", disabled, ...props }, ref) => {
    return (
      <div className="flex flex-col">
        {label && (
          <label className="text-xs font-medium text-zinc-400 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          disabled={disabled}
          className={[
            "w-full border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm outline-none transition-colors duration-150 min-h-[120px] resize-y bg-surface text-zinc-200 placeholder:text-zinc-600",
            error ? "border-danger focus:border-danger" : "",
            disabled ? "opacity-40 cursor-not-allowed" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {error && (
          <span className="text-2xs text-danger font-medium mt-1">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };
