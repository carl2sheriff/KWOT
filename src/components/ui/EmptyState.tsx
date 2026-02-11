"use client";

import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="text-zinc-700 mb-4">
        {icon || <Inbox className="h-12 w-12" />}
      </div>
      <h3 className="text-sm font-semibold text-zinc-300">{title}</h3>
      {description && (
        <p className="text-xs text-zinc-500 mt-1.5 text-center max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
