"use client";

import { useTasks } from "@/hooks/useTasks";
import { useSurvivalMode } from "@/hooks/useSurvivalMode";
import { GapFinder } from "@/components/dashboard/GapFinder";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { CalendarClock } from "lucide-react";
import { format } from "date-fns";

export default function SchedulePage() {
  const { tasks, loading } = useTasks();
  const { isSurvivalMode, congestedTasks, daysUntilClear } = useSurvivalMode();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CalendarClock className="h-6 w-6 text-primary" />
          Study Planner
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isSurvivalMode ? (
            <span className="text-primary font-medium">
              ⚡ Survival Mode — {congestedTasks.length} deadlines in the next 7 days · {daysUntilClear}d until clear
            </span>
          ) : (
            <>Today is <span className="text-foreground font-medium">{format(new Date(), "EEEE, MMMM d")}</span>. Define your free time to auto-generate focused study sprints.</>
          )}
        </p>
      </div>

      {/* Mode Info */}
      {isSurvivalMode && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm space-y-1">
          <p className="font-semibold text-primary">⚡ Survival Mode Active</p>
          <p className="text-muted-foreground text-xs">
            Sprint duration is locked to <strong className="text-foreground">25-minute Pomodoro blocks</strong> to reduce cognitive load during congested periods. All sessions are bite-sized to maximize focus.
          </p>
        </div>
      )}

      {/* GapFinder or skeleton */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} rows={2} showHeader />
          ))}
        </div>
      ) : (
        <GapFinder tasks={tasks} isSurvivalMode={isSurvivalMode} />
      )}
    </div>
  );
}
