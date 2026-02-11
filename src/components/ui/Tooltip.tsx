"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

interface TooltipProps {
  content: string | React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  children: React.ReactNode;
}

const arrowStyles: Record<NonNullable<TooltipProps["position"]>, string> = {
  top: "left-1/2 -translate-x-1/2 top-full border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-zinc-800",
  bottom: "left-1/2 -translate-x-1/2 bottom-full border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-zinc-800",
  left: "top-1/2 -translate-y-1/2 left-full border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[5px] border-l-zinc-800",
  right: "top-1/2 -translate-y-1/2 right-full border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[5px] border-r-zinc-800",
};

const positionStyles: Record<NonNullable<TooltipProps["position"]>, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

function Tooltip({ content, position = "top", delay = 300, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hideTooltip = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {visible && (
        <div
          className={[
            "absolute z-50 animate-fade-in pointer-events-none",
            positionStyles[position],
          ].join(" ")}
        >
          <div className="relative bg-zinc-800 border border-zinc-700/50 text-zinc-200 text-xs px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap">
            {content}
            <span className={["absolute w-0 h-0", arrowStyles[position]].join(" ")} />
          </div>
        </div>
      )}
    </div>
  );
}

export { Tooltip };
export type { TooltipProps };
