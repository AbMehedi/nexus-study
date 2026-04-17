"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SurvivalBannerProps {
  congestedTaskCount: number;
  daysUntilClear?: number;
  className?: string;
}

export function SurvivalBanner({
  congestedTaskCount,
  daysUntilClear,
  className,
}: SurvivalBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "animate-slide-down animate-breathe-glow",
        "relative flex items-center gap-3 px-4 py-3",
        "rounded-xl border border-[oklch(0.65_0.22_25/0.4)]",
        "bg-gradient-to-r from-[oklch(0.65_0.22_25/0.15)] via-[oklch(0.72_0.18_55/0.12)] to-[oklch(0.65_0.22_25/0.08)]",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Pulsing indicator dot */}
      <span className="relative flex h-3 w-3 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[oklch(0.65_0.22_25)] opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-[oklch(0.65_0.22_25)]" />
      </span>

      {/* Icon */}
      <AlertTriangle
        className="h-4 w-4 shrink-0 text-[oklch(0.72_0.18_55)]"
        aria-hidden="true"
      />

      {/* Text */}
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-sm text-[oklch(0.9_0.05_55)]">
          ⚡ Survival Mode Active
        </span>
        <span className="ml-2 text-sm text-[oklch(0.75_0.03_55)]">
          {congestedTaskCount} deadline{congestedTaskCount !== 1 ? "s" : ""} within 7 days.
          {daysUntilClear !== undefined && daysUntilClear > 0 && (
            <> Clears in <strong className="text-[oklch(0.9_0.05_55)]">{daysUntilClear}d</strong>.</>
          )}
          {" "}Sprints auto-shortened to 25 min Pomodoro blocks.
        </span>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss survival mode banner"
        className="ml-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
