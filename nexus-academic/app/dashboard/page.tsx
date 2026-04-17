"use client";

import { useAuth } from "@/context/AuthContext";
import { useTasks } from "@/hooks/useTasks";
import { useSurvivalMode } from "@/hooks/useSurvivalMode";
import { HeroCountdown } from "@/components/dashboard/HeroCountdown";
import { DeadlineHeatMap } from "@/components/dashboard/DeadlineHeatMap";
import { SkeletonCard, SkeletonCountdown, SkeletonHeatmap } from "@/components/ui/skeleton-card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Clock,
  CheckSquare,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { getMostUrgentTask } from "@/lib/priority-engine";
import type { Task } from "@/lib/types";

function getUrgencyColor(hoursLeft: number) {
  if (hoursLeft < 6) return "text-[oklch(0.65_0.22_25)] animate-countdown-pulse";
  if (hoursLeft < 24) return "text-[oklch(0.65_0.22_25)]";
  if (hoursLeft < 72) return "text-[oklch(0.78_0.18_55)]";
  return "text-primary";
}

function getUrgencyBadge(hoursLeft: number): { label: string; variant: "destructive" | "secondary" | "outline" } {
  if (hoursLeft < 6) return { label: "CRITICAL", variant: "destructive" };
  if (hoursLeft < 24) return { label: "DUE SOON", variant: "destructive" };
  if (hoursLeft < 72) return { label: "URGENT", variant: "secondary" };
  return { label: "UPCOMING", variant: "outline" };
}

function StatsCard({
  label,
  value,
  icon: Icon,
  subtext,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  subtext?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 flex items-start gap-4 animate-fade-in-up",
        accent && "border-primary/30 bg-primary/5"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          accent ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
        <p className={cn("text-2xl font-bold mt-0.5", accent && "text-primary")}>{value}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}

function UpcomingTaskRow({ task }: { task: Task }) {
  const deadline = task.deadline instanceof Date ? task.deadline : new Date((task.deadline as { seconds: number }).seconds * 1000);
  const hoursLeft = (deadline.getTime() - Date.now()) / 3_600_000;
  const urgencyClass = getUrgencyColor(hoursLeft);
  const { label, variant } = getUrgencyBadge(hoursLeft);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
          task.type === "EXAM" && "bg-red-500/15 text-red-400",
          task.type === "ASSIGNMENT" && "bg-blue-500/15 text-blue-400",
          task.type === "PROJECT" && "bg-purple-500/15 text-purple-400",
          task.type === "PRESENTATION" && "bg-yellow-500/15 text-yellow-400",
        )}
        title={task.type}
      >
        {task.type.slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
        <p className="text-xs text-muted-foreground">{task.courseCode}</p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <Badge variant={variant} className="text-[10px] px-1.5 py-0">{label}</Badge>
        <span className={cn("text-[11px] font-mono", urgencyClass)}>
          {formatDistanceToNow(deadline, { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { tasks, loading } = useTasks();
  const { isSurvivalMode } = useSurvivalMode();

  const now = Date.now();
  const pendingTasks = tasks.filter((t) => t.status !== "DONE");
  const upcomingTasks = [...pendingTasks]
    .sort((a, b) => {
      const aD = a.deadline instanceof Date ? a.deadline : new Date((a.deadline as { seconds: number }).seconds * 1000);
      const bD = b.deadline instanceof Date ? b.deadline : new Date((b.deadline as { seconds: number }).seconds * 1000);
      return aD.getTime() - bD.getTime();
    })
    .slice(0, 5);

  const dueSoon = pendingTasks.filter((t) => {
    const d = t.deadline instanceof Date ? t.deadline : new Date((t.deadline as { seconds: number }).seconds * 1000);
    return d.getTime() - now < 24 * 3_600_000;
  }).length;

  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completed = tasks.filter((t) => t.status === "DONE").length;

  const mostUrgentTask = getMostUrgentTask(pendingTasks);

  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "Student";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, {displayName} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isSurvivalMode
              ? "⚡ Survival Mode is active. Focus on your most critical deadlines."
              : "Here's your academic overview for today."}
          </p>
        </div>
        <Link href="/dashboard/tasks">
          <Button id="dashboard-add-task-btn" size="sm" className="gap-2 shrink-0">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Task
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {loading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} rows={1} showHeader />
            ))}
          </>
        ) : (
          <>
            <StatsCard
              label="Pending"
              value={pendingTasks.length}
              icon={CheckSquare}
              subtext="tasks remaining"
            />
            <StatsCard
              label="Due Soon"
              value={dueSoon}
              icon={Clock}
              subtext="within 24 hours"
              accent={dueSoon > 0}
            />
            <StatsCard
              label="In Progress"
              value={inProgress}
              icon={TrendingUp}
              subtext="active tasks"
            />
            <StatsCard
              label="Completed"
              value={completed}
              icon={Zap}
              subtext="this period"
            />
          </>
        )}
      </div>

      {/* Main grid — HeroCountdown + HeatMap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* HeroCountdown */}
        <div className="lg:col-span-2">
          {loading ? (
            <SkeletonCountdown />
          ) : (
            <HeroCountdown task={mostUrgentTask} isSurvivalMode={isSurvivalMode} />
          )}
        </div>

        {/* Deadline HeatMap */}
        <div>
          {loading ? (
            <SkeletonHeatmap />
          ) : (
            <DeadlineHeatMap tasks={tasks} />
          )}
        </div>
      </div>

      {/* Upcoming tasks list */}
      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
          <Link href="/dashboard/tasks">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} showHeader={false} rows={1} className="h-12 p-3" />
              ))}
            </div>
          ) : upcomingTasks.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-3 text-muted-foreground">
              <CheckSquare className="h-8 w-8 opacity-30" />
              <p className="text-sm">All clear — no pending deadlines!</p>
              <Link href="/dashboard/tasks">
                <Button variant="outline" size="sm">Add your first task</Button>
              </Link>
            </div>
          ) : (
            <div>
              {upcomingTasks.map((task) => (
                <UpcomingTaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
