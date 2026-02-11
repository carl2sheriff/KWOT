"use client";

import React from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 border-b border-zinc-800/50 bg-surface-raised/80 backdrop-blur-xl">
      <div className="flex items-baseline gap-3">
        <h1 className="text-base font-semibold text-zinc-100">{title}</h1>
        {subtitle && (
          <span className="text-sm text-zinc-500">{subtitle}</span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
