"use client";

import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  rows?: number;
  showHeader?: boolean;
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md animate-shimmer",
        className
      )}
    />
  );
}

export function SkeletonCard({ className, rows = 3, showHeader = true }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 space-y-4",
        className
      )}
    >
      {showHeader && (
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-8 w-8 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <SkeletonBlock className="h-4 w-2/5" />
            <SkeletonBlock className="h-3 w-1/4" />
          </div>
        </div>
      )}
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded-md animate-shimmer"
            style={{ width: `${80 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonCountdown({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-8 flex flex-col items-center gap-6",
        className
      )}
    >
      <SkeletonBlock className="h-5 w-32" />
      <SkeletonBlock className="h-20 w-64 rounded-xl" />
      <div className="flex gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonBlock key={i} className="h-14 w-16 rounded-lg" />
        ))}
      </div>
      <SkeletonBlock className="h-4 w-48" />
    </div>
  );
}

export function SkeletonHeatmap({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5",
        className
      )}
    >
      <SkeletonBlock className="h-4 w-24 mb-4" />
      <div className="flex gap-1.5">
        {Array.from({ length: 8 }).map((_, w) => (
          <div key={w} className="flex flex-col gap-1.5">
            {Array.from({ length: 7 }).map((_, d) => (
              <SkeletonBlock key={d} className="h-4 w-4 rounded-sm" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
