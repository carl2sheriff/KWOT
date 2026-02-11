"use client";

import React from "react";

interface LoadingStateProps {
  variant?: "spinner" | "skeleton" | "progress";
  message?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
  progress?: number;
}

const spinnerSizes: Record<NonNullable<LoadingStateProps["size"]>, string> = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
};

function Loading({
  variant = "spinner",
  message,
  fullScreen = false,
  size = "md",
  progress = 0,
}: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      {variant === "spinner" && (
        <div
          className={`${spinnerSizes[size]} rounded-full border-zinc-800 border-t-accent animate-spin`}
        />
      )}

      {variant === "skeleton" && (
        <div className="w-full max-w-sm space-y-3">
          <div className="h-4 skeleton rounded w-full" />
          <div className="h-4 skeleton rounded w-3/4" />
          <div className="h-4 skeleton rounded w-1/2" />
        </div>
      )}

      {variant === "progress" && (
        <div className="w-full max-w-sm">
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
          <p className="text-2xs text-zinc-500 mt-2 text-center tabular-nums">
            {Math.round(Math.min(Math.max(progress, 0), 100))}%
          </p>
        </div>
      )}

      {message && (
        <p className="text-xs text-zinc-500 animate-pulse">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-surface/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

function LoadingCard() {
  return (
    <div className="rounded-lg border border-zinc-800/50 bg-surface-raised p-5">
      <div className="h-4 skeleton rounded w-1/3 mb-4" />
      <div className="space-y-2.5">
        <div className="h-3 skeleton rounded w-full" />
        <div className="h-3 skeleton rounded w-5/6" />
        <div className="h-3 skeleton rounded w-2/3" />
      </div>
    </div>
  );
}

function LoadingTable() {
  return (
    <div className="rounded-lg border border-zinc-800/50 overflow-hidden">
      <div className="flex gap-4 px-5 py-3 bg-surface-raised border-b border-zinc-800/50">
        <div className="h-3 skeleton rounded w-1/4" />
        <div className="h-3 skeleton rounded w-1/4" />
        <div className="h-3 skeleton rounded w-1/4" />
        <div className="h-3 skeleton rounded w-1/4" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-5 py-3 border-b border-zinc-800/30 last:border-b-0"
        >
          <div className="h-3 skeleton rounded w-1/4" />
          <div className="h-3 skeleton rounded w-1/4" />
          <div className="h-3 skeleton rounded w-1/4" />
          <div className="h-3 skeleton rounded w-1/4" />
        </div>
      ))}
    </div>
  );
}

export { Loading, LoadingCard, LoadingTable };
export type { LoadingStateProps };
