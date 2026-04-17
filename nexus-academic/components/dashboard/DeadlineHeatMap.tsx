"use client";

import { useMemo } from "react";
import type { Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { addDays, format, isSameDay, startOfWeek, startOfDay } from "date-fns";
import { Grid2x2 } from "lucide-react";

// ─── Config ────────────────────────────────────────────────────────────────────

const WEEKS = 8;
const DAYS_PER_WEEK = 7;
const TOTAL_CELLS = WEEKS * DAYS_PER_WEEK; // 56

// OKLCH-based density colors matching the dark theme primary (264°)
const DENSITY_COLORS = [
  "bg-[oklch(0.22_0.01_264)]",           // 0 tasks — near-empty
  "bg-[oklch(0.45_0.15_264)]",           // 1 task — low
  "bg-[oklch(0.58_0.20_264)]",           // 2-3 tasks — medium
  "bg-[oklch(0.70_0.24_264)]",           // 4+ tasks — high (primary-ish)
];

function getDensityIndex(count: number): 0 | 1 | 2 | 3 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  return 3;
}

function toDate(d: unknown): Date {
  if (d instanceof Date) return d;
  if (d && typeof (d as { toDate?: () => Date }).toDate === "function") {
    return (d as { toDate: () => Date }).toDate();
  }
  return new Date(d as string | number);
}

// ─── DeadlineHeatMap ─────────────────────────────────────────────────────────

interface DeadlineHeatMapProps {
  tasks: Task[];
}

export function DeadlineHeatMap({ tasks }: DeadlineHeatMapProps) {
  const today = startOfDay(new Date());

  // Anchor: start of the current week (Monday)
  const gridStart = startOfWeek(today, { weekStartsOn: 1 });

  // Build a map: dateKey → tasks[]
  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      if (task.status === "DONE") return;
      const d = startOfDay(toDate(task.deadline));
      const key = format(d, "yyyy-MM-dd");
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, task]);
    });
    return map;
  }, [tasks]);

  // Build 8 columns of 7 cells
  const weeks: Date[][] = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: DAYS_PER_WEEK }, (_, d) => addDays(gridStart, w * 7 + d))
  );

  const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <Card className="rounded-xl h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Grid2x2 className="h-4 w-4 text-primary" />
          Deadline Density
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          {WEEKS}-week overview · pending tasks only
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <TooltipProvider>
          {/* Weekday row labels */}
          <div className="flex gap-1.5 pl-0">
            {weekdayLabels.map((label, i) => (
              <div
                key={i}
                className="h-4 w-4 flex items-center justify-center text-[9px] text-muted-foreground font-medium"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid: render by column (week), iterate rows (day) */}
          <div className="flex gap-1.5">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5">
                {week.map((day, dIdx) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayTasks = tasksByDay.get(key) ?? [];
                  const densityIdx = getDensityIndex(dayTasks.length);
                  const isToday = isSameDay(day, today);
                  const isPast = day < today;

                  return (
                    <Tooltip key={dIdx}>
                      <TooltipTrigger
                        className={cn(
                          "h-4 w-4 rounded-sm cursor-default transition-transform duration-150 hover:scale-125",
                          DENSITY_COLORS[densityIdx],
                          isToday && "ring-2 ring-primary ring-offset-1 ring-offset-card",
                          isPast && densityIdx === 0 && "opacity-30"
                        )}
                        aria-label={`${format(day, "MMM d")}: ${dayTasks.length} task${dayTasks.length !== 1 ? "s" : ""}`}
                      />
                      <TooltipContent
                        side="top"
                        className="text-xs bg-card border-border shadow-xl max-w-48"
                      >
                        <p className="font-semibold text-foreground mb-1">
                          {format(day, "EEEE, MMM d")}
                          {isToday && (
                            <span className="ml-1.5 text-primary text-[10px]">— Today</span>
                          )}
                        </p>
                        {dayTasks.length === 0 ? (
                          <p className="text-muted-foreground">No deadlines</p>
                        ) : (
                          <ul className="space-y-0.5">
                            {dayTasks.map((t) => (
                              <li key={t.id} className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full shrink-0",
                                    t.type === "EXAM" && "bg-red-400",
                                    t.type === "ASSIGNMENT" && "bg-blue-400",
                                    t.type === "PROJECT" && "bg-purple-400",
                                    t.type === "PRESENTATION" && "bg-yellow-400"
                                  )}
                                />
                                <span className="text-foreground truncate max-w-32">{t.title}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </TooltipProvider>

        {/* Month labels below grid */}
        <div className="flex gap-1.5 overflow-hidden">
          {weeks.map((week, wIdx) => {
            const firstDayOfWeek = week[0];
            const showLabel = firstDayOfWeek.getDate() <= 7 || wIdx === 0;
            return (
              <div key={wIdx} className="w-4 text-center">
                {showLabel && (
                  <span className="text-[9px] text-muted-foreground font-medium">
                    {format(firstDayOfWeek, "MMM")}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] text-muted-foreground">None</span>
          {DENSITY_COLORS.map((color, i) => (
            <div
              key={i}
              className={cn("h-3 w-3 rounded-sm", color)}
              title={["0", "1", "2–3", "4+"][i] + " tasks"}
            />
          ))}
          <span className="text-[10px] text-muted-foreground">4+</span>
        </div>
      </CardContent>
    </Card>
  );
}
