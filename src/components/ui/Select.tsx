"use client";

import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      placeholder,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="flex flex-col">
        {label && (
          <label className="text-xs font-medium text-zinc-400 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            className={[
              "w-full appearance-none border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm outline-none transition-colors duration-150 bg-surface text-zinc-200 pr-10",
              error ? "border-danger focus:border-danger" : "",
              disabled ? "opacity-40 cursor-not-allowed" : "",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 pointer-events-none"
          />
        </div>
        {error && (
          <span className="text-2xs text-danger font-medium mt-1">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

export { Select };
export type { SelectProps };
