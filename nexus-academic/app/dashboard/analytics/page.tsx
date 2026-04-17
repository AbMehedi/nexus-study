"use client";

import { useMemo, useState, useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  BarChart2,
  TrendingUp,
  CheckCircle2,
  Target,
  Layers,
  Clock,
} from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import type { TaskWithPriority } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(d: unknown): Date {
  if (d instanceof Date) return d;
  if (d && typeof (d as { toDate?: () => Date }).toDate === "function") {
    return (d as { toDate: () => Date }).toDate();
  }
  return new Date(d as string | number);
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 flex items-start gap-4",
        accent && "border-primary/30 bg-primary/5"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          accent ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
        <p className={cn("text-2xl font-bold mt-0.5", accent && "text-primary")}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Completion Timeline Chart ─────────────────────────────────────────────────

function CompletionChart({ tasks }: { tasks: TaskWithPriority[] }) {
  const data = useMemo(() => {
    const today = startOfDay(new Date());
    const days = eachDayOfInterval({ start: subDays(today, 13), end: today });

    return days.map((day) => {
      const label = format(day, "MMM d");
      const completed = tasks.filter((t) => {
        if (t.status !== "DONE") return false;
        const created = toDate(t.createdAt);
        return startOfDay(created).getTime() === day.getTime();
      }).length;
      const added = tasks.filter((t) => {
        const created = toDate(t.createdAt);
        return startOfDay(created).getTime() === day.getTime();
      }).length;
      return { label, completed, added };
    });
  }, [tasks]);

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          Task Activity — Last 14 Days
        </CardTitle>
        <p className="text-xs text-muted-foreground">Tasks added vs completed by day</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: -24 }}>
            <defs>
              <linearGradient id="gradAdded" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="added"
              name="Added"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#gradAdded)"
            />
            <Area
              type="monotone"
              dataKey="completed"
              name="Completed"
              stroke="#34d399"
              strokeWidth={2}
              fill="url(#gradCompleted)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Task Type Distribution Chart ─────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  EXAM: "#f87171",
  ASSIGNMENT: "#60a5fa",
  PROJECT: "#a78bfa",
  PRESENTATION: "#fbbf24",
};

const RADIAN = Math.PI / 180;
function renderCustomizedLabel(props: {
  cx?: number; cy?: number; midAngle?: number;
  innerRadius?: number; outerRadius?: number;
  percent?: number; name?: string;
}) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0, name = "" } = props;
  if (percent < 0.06) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x} y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={10}
      fontWeight={600}
    >
      {name.slice(0, 4)}
    </text>
  );
}

function TaskTypeChart({ tasks }: { tasks: TaskWithPriority[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      counts[t.type] = (counts[t.type] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  if (data.length === 0) return null;

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4 text-primary" />
          Task Type Breakdown
        </CardTitle>
        <p className="text-xs text-muted-foreground">Distribution across all task categories</p>
      </CardHeader>
      <CardContent className="flex items-center justify-center gap-6 flex-wrap">
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={renderCustomizedLabel}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={TYPE_COLORS[entry.name] ?? "#94a3b8"} />
              ))}
            </Pie>
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2 text-sm">
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: TYPE_COLORS[entry.name] ?? "#94a3b8" }}
              />
              <span className="text-muted-foreground font-mono text-xs">{entry.name}</span>
              <span className="font-bold text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Priority Distribution Bar Chart ──────────────────────────────────────────

function PriorityDistributionChart({ tasks }: { tasks: TaskWithPriority[] }) {
  const pending = tasks.filter((t) => t.status !== "DONE");

  const data = useMemo(() => {
    let critical = 0, urgent = 0, upcoming = 0;
    pending.forEach((t) => {
      const deadline = toDate(t.deadline);
      const hours = (deadline.getTime() - Date.now()) / 3_600_000;
      if (hours < 0) critical++;
      else if (hours < 24) critical++;
      else if (hours < 72) urgent++;
      else upcoming++;
    });
    return [
      { label: "Critical", count: critical, fill: "oklch(0.65 0.22 25)" },
      { label: "Urgent", count: urgent, fill: "oklch(0.72 0.18 55)" },
      { label: "Upcoming", count: upcoming, fill: "hsl(var(--primary))" },
    ];
  }, [pending]);

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-primary" />
          Pending Tasks by Urgency
        </CardTitle>
        <p className="text-xs text-muted-foreground">How many tasks fall in each urgency tier</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: -24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            />
            <Bar dataKey="count" name="Tasks" radius={[6, 6, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Course Workload Chart ─────────────────────────────────────────────────────

function CourseWorkloadChart({ tasks }: { tasks: TaskWithPriority[] }) {
  const data = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    tasks.forEach((t) => {
      if (!map[t.courseCode]) map[t.courseCode] = { total: 0, done: 0 };
      map[t.courseCode].total++;
      if (t.status === "DONE") map[t.courseCode].done++;
    });
    return Object.entries(map)
      .map(([course, { total, done }]) => ({ course, total, done, pending: total - done }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [tasks]);

  if (data.length === 0) return null;

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" />
          Workload by Course
        </CardTitle>
        <p className="text-xs text-muted-foreground">Total tasks per course code (pending vs done)</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: -24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
            <XAxis
              dataKey="course"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}
            />
            <Bar dataKey="pending" name="Pending" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
            <Bar dataKey="done" name="Done" stackId="a" fill="#34d399" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { tasks, loading: tasksLoading } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();
  const loading = tasksLoading || projectsLoading;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const pendingTasks = tasks.filter((t) => t.status !== "DONE").length;
  const activeProjects = projects.filter((p) => p.phase !== "SUBMISSION").length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-primary" />
          Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Productivity insights across all your tasks and projects.
        </p>
      </div>

      {/* Summary stats */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} rows={1} showHeader />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total Tasks"
            value={tasks.length}
            sub="across all courses"
            icon={CheckCircle2}
            accent
          />
          <StatCard
            label="Completed"
            value={completedTasks}
            sub={`${completionRate}% completion rate`}
            icon={TrendingUp}
          />
          <StatCard
            label="Pending"
            value={pendingTasks}
            sub="require attention"
            icon={Clock}
          />
          <StatCard
            label="Active Projects"
            value={activeProjects}
            sub={`${projects.length} total projects`}
            icon={Layers}
          />
        </div>
      )}

      {/* Completion rate badge */}
      {!loading && tasks.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 px-4 py-3">
          <div className="flex-1 bg-muted/30 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-xs shrink-0",
              completionRate >= 70 ? "text-emerald-400 border-emerald-500/30" :
              completionRate >= 40 ? "text-primary border-primary/30" :
              "text-[oklch(0.72_0.18_55)] border-[oklch(0.72_0.18_55)]/30"
            )}
          >
            {completionRate}% Complete
          </Badge>
        </div>
      )}

      {/* Charts */}
      {loading || !isMounted ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} rows={4} showHeader className="h-64" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center py-24 gap-5 text-center">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BarChart2 className="h-10 w-10 text-primary/30" />
          </div>
          <div>
            <p className="text-foreground font-semibold text-lg">No data yet</p>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
              Add tasks and track your progress — your analytics will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Full-width area chart */}
          <CompletionChart tasks={tasks} />

          {/* 2-column charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PriorityDistributionChart tasks={tasks} />
            <TaskTypeChart tasks={tasks} />
          </div>

          {/* Course workload */}
          <CourseWorkloadChart tasks={tasks} />
        </div>
      )}
    </div>
  );
}
