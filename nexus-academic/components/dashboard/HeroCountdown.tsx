"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { calculatePriority } from "@/lib/priority-engine";
import { Zap, CalendarClock, ArrowRight, CheckSquare } from "lucide-react";
import { format } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(d: unknown): Date {
  if (d instanceof Date) return d;
  if (d && typeof (d as { toDate?: () => Date }).toDate === "function") {
    return (d as { toDate: () => Date }).toDate();
  }
  return new Date(d as string | number);
}

function padTwo(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

function getTimeLeft(deadline: Date): TimeLeft {
  const diff = Math.max(0, deadline.getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalSeconds };
}

// ─── Urgency config ───────────────────────────────────────────────────────────

function getUrgencyConfig(totalSeconds: number) {
  const hours = totalSeconds / 3600;
  if (hours < 6) {
    return {
      ring: "border-[oklch(0.65_0.22_25)] shadow-[0_0_30px_4px_oklch(0.65_0.22_25/0.25)]",
      gradient: "from-[oklch(0.65_0.22_25)]/10 to-transparent",
      digitColor: "text-[oklch(0.65_0.22_25)]",
      badgeVariant: "destructive" as const,
      label: "CRITICAL",
      pulse: true,
    };
  }
  if (hours < 24) {
    return {
      ring: "border-[oklch(0.65_0.22_25)]/60",
      gradient: "from-[oklch(0.65_0.22_25)]/8 to-transparent",
      digitColor: "text-[oklch(0.65_0.22_25)]",
      badgeVariant: "destructive" as const,
      label: "DUE SOON",
      pulse: false,
    };
  }
  if (hours < 72) {
    return {
      ring: "border-[oklch(0.72_0.18_55)]/50",
      gradient: "from-[oklch(0.72_0.18_55)]/8 to-transparent",
      digitColor: "text-[oklch(0.72_0.18_55)]",
      badgeVariant: "secondary" as const,
      label: "URGENT",
      pulse: false,
    };
  }
  return {
    ring: "border-primary/30",
    gradient: "from-primary/5 to-transparent",
    digitColor: "text-primary",
    badgeVariant: "outline" as const,
    label: "UPCOMING",
    pulse: false,
  };
}

// ─── Digit Flip Unit ──────────────────────────────────────────────────────────

function DigitUnit({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  const prev = useRef(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (prev.current !== value) {
      setFlipping(true);
      const t = setTimeout(() => setFlipping(false), 200);
      prev.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "relative flex h-16 w-14 sm:h-20 sm:w-16 items-center justify-center rounded-xl",
          "bg-card/60 border border-border/60 backdrop-blur-sm",
          "transition-transform duration-100",
          flipping && "scale-95"
        )}
      >
        <span className={cn("text-3xl sm:text-4xl font-black font-mono tabular-nums", color)}>
          {padTwo(value)}
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
        {label}
      </span>
    </div>
  );
}

// ─── Separator ────────────────────────────────────────────────────────────────

function Separator({ color }: { color: string }) {
  return (
    <div className="flex flex-col gap-2 pb-5">
      <span className={cn("text-2xl font-black font-mono leading-none", color)}>:</span>
    </div>
  );
}

// ─── HeroCountdown ────────────────────────────────────────────────────────────

interface HeroCountdownProps {
  task: Task | null;
  isSurvivalMode: boolean;
}

export function HeroCountdown({ task, isSurvivalMode }: HeroCountdownProps) {
  const deadline = task ? toDate(task.deadline) : null;
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(
    deadline ? getTimeLeft(deadline) : { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 }
  );

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setTimeLeft(getTimeLeft(deadline)), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!task || !deadline) {
    return (
      <Card className="rounded-2xl border-border/40">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CheckSquare className="h-8 w-8 text-primary/30" />
          </div>
          <div>
            <p className="text-foreground font-semibold">No upcoming deadlines</p>
            <p className="text-muted-foreground text-sm mt-1">You're all caught up! 🎉</p>
          </div>
          <Link href="/dashboard/tasks">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowRight className="h-3.5 w-3.5" /> View Tasks
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const cfg = getUrgencyConfig(timeLeft.totalSeconds);
  const priority = calculatePriority(task);
  const priorityDisplay = priority === Infinity ? "∞" : priority < 1 ? priority.toFixed(3) : priority.toFixed(2);

  return (
    <Card
      className={cn(
        "rounded-2xl border-2 bg-gradient-to-br transition-all duration-700",
        cfg.ring,
        cfg.gradient,
        isSurvivalMode && timeLeft.totalSeconds / 3600 < 6 && "animate-breathe-glow"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
            Most Urgent Deadline
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={cfg.badgeVariant}
              className={cn("text-[10px] px-2 py-0 font-bold tracking-wider", cfg.pulse && "animate-countdown-pulse")}
            >
              {cfg.label}
            </Badge>
            {isSurvivalMode && (
              <Badge variant="outline" className="text-[10px] px-2 py-0 border-primary/40 text-primary">
                ⚡ SURVIVAL
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-6 py-4">
        {/* Task title + meta */}
        <div className="text-center space-y-1.5 px-4">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full",
              "bg-card/60 border border-border/50"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                task.type === "EXAM" && "bg-red-400",
                task.type === "ASSIGNMENT" && "bg-blue-400",
                task.type === "PROJECT" && "bg-purple-400",
                task.type === "PRESENTATION" && "bg-yellow-400"
              )}
            />
            {task.type} · {task.courseCode}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight">
            {task.title}
          </h2>
          {task.location && (
            <p className="text-xs text-muted-foreground">📍 {task.location}</p>
          )}
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            {format(deadline, "EEEE, MMM d yyyy 'at' h:mm a")}
          </p>
        </div>

        {/* Live ticker */}
        <div
          className="flex items-end gap-1.5 sm:gap-2"
          role="timer"
          aria-label={`Time remaining: ${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds`}
        >
          {timeLeft.days > 0 && (
            <>
              <DigitUnit value={timeLeft.days} label="Days" color={cfg.digitColor} />
              <Separator color={cfg.digitColor} />
            </>
          )}
          <DigitUnit value={timeLeft.hours} label="Hours" color={cfg.digitColor} />
          <Separator color={cfg.digitColor} />
          <DigitUnit value={timeLeft.minutes} label="Min" color={cfg.digitColor} />
          <Separator color={cfg.digitColor} />
          <DigitUnit value={timeLeft.seconds} label="Sec" color={cfg.digitColor} />
        </div>

        {/* Footer row: priority + sprint CTA */}
        <div className="flex items-center justify-between w-full px-2 pt-1 border-t border-border/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">P-Score:</span>
            <span className={cn("font-bold font-mono text-sm", cfg.digitColor)}>{priorityDisplay}</span>
            {task.weightage && (
              <span className="text-muted-foreground/60 border-l border-border pl-2">
                {task.weightage}% of grade
              </span>
            )}
          </div>
          <Link href="/dashboard/schedule">
            <Button id="hero-start-sprint-btn" size="sm" className="gap-1.5 h-8 text-xs">
              <Zap className="h-3 w-3" />
              Plan Sprints
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
