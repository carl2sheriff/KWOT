"use client";

import React from "react";
import { Check } from "lucide-react";

interface Step {
  label: string;
  status: "completed" | "current" | "pending";
}

interface StepperProps {
  steps: Step[];
}

function StepCircle({ step, index }: { step: Step; index: number }) {
  if (step.status === "completed") {
    return (
      <div className="w-7 h-7 rounded-full bg-success flex items-center justify-center shrink-0">
        <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
      </div>
    );
  }

  if (step.status === "current") {
    return (
      <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0 shadow-glow">
        <span className="text-xs font-semibold text-white">{index + 1}</span>
      </div>
    );
  }

  return (
    <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
      <span className="text-xs font-medium text-zinc-500">{index + 1}</span>
    </div>
  );
}

function Stepper({ steps }: StepperProps) {
  return (
    <div className="flex items-start">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <StepCircle step={step} index={index} />
            <span
              className={[
                "text-2xs font-medium mt-1.5 text-center whitespace-nowrap",
                step.status === "completed"
                  ? "text-success"
                  : step.status === "current"
                    ? "text-accent"
                    : "text-zinc-600",
              ].join(" ")}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 flex items-center px-2 mt-3.5">
              <div
                className={[
                  "h-px w-full",
                  step.status === "completed" ? "bg-success" : "bg-zinc-800",
                ].join(" ")}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export { Stepper };
export type { Step, StepperProps };
