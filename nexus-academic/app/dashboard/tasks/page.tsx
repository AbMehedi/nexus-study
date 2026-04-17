"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTasks } from "@/hooks/useTasks";
import { updateDoc, deleteDoc } from "@/lib/firestore-service";
import { exportTasksToCSV } from "@/lib/export";
import { AddTaskDialog } from "@/components/dashboard/AddTaskDialog";
import { EditTaskDialog } from "@/components/dashboard/EditTaskDialog";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import type { TaskWithPriority, SubTask } from "@/lib/types";
import {
  Plus,
  Trash2,
  CheckSquare,
  Clock,
  AlertTriangle,
  Zap,
  ChevronRight,
  CheckCircle2,
  Circle,
  Timer,
  Pencil,
  Download,
  Filter,
  X as XIcon,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  ListChecks,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(d: unknown): Date {
  if (d instanceof Date) return d;
  if (d && typeof (d as { toDate?: () => Date }).toDate === "function") {
    return (d as { toDate: () => Date }).toDate();
  }
  return new Date(d as string | number);
}

type Status = "TODO" | "IN_PROGRESS" | "DONE";
type TaskType = "EXAM" | "ASSIGNMENT" | "PROJECT" | "PRESENTATION";
type SortKey = "deadline" | "priority" | "importance" | "title";

const STATUS_CYCLE: Record<Status, Status> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
};

const STATUS_ICON: Record<Status, React.ElementType> = {
  TODO: Circle,
  IN_PROGRESS: Timer,
  DONE: CheckCircle2,
};

const STATUS_COLOR: Record<Status, string> = {
  TODO: "text-muted-foreground",
  IN_PROGRESS: "text-yellow-400",
  DONE: "text-emerald-400",
};

const TYPE_COLOR: Record<string, string> = {
  EXAM: "bg-red-500/15 text-red-400 border-red-500/20",
  ASSIGNMENT: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  PROJECT: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  PRESENTATION: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
};

function getUrgencyTier(task: TaskWithPriority): "critical" | "urgent" | "upcoming" | "done" {
  if (task.status === "DONE") return "done";
  const deadline = toDate(task.deadline);
  const hoursLeft = (deadline.getTime() - Date.now()) / 3_600_000;
  if (hoursLeft < 24) return "critical";
  if (hoursLeft < 72) return "urgent";
  return "upcoming";
}

const TIER_CONFIG = {
  critical: {
    label: "Critical — Due within 24h",
    icon: AlertTriangle,
    headerClass: "text-[oklch(0.65_0.22_25)]",
    borderClass: "border-l-4 border-l-[oklch(0.65_0.22_25)]",
  },
  urgent: {
    label: "Urgent — Due within 72h",
    icon: Clock,
    headerClass: "text-[oklch(0.72_0.18_55)]",
    borderClass: "border-l-4 border-l-[oklch(0.72_0.18_55)]",
  },
  upcoming: {
    label: "Upcoming",
    icon: ChevronRight,
    headerClass: "text-primary",
    borderClass: "border-l-4 border-l-primary/40",
  },
  done: {
    label: "Completed",
    icon: CheckSquare,
    headerClass: "text-muted-foreground",
    borderClass: "border-l-4 border-l-border",
  },
};

// ─── Filter Bar ───────────────────────────────────────────────────────────────

const TASK_TYPES: TaskType[] = ["EXAM", "ASSIGNMENT", "PROJECT", "PRESENTATION"];
const STATUSES: Status[] = ["TODO", "IN_PROGRESS", "DONE"];
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "deadline", label: "Deadline" },
  { key: "priority", label: "Priority" },
  { key: "importance", label: "Importance" },
  { key: "title", label: "Title A–Z" },
];

function FilterBar({
  typeFilter,
  statusFilter,
  courseFilter,
  sortKey,
  onTypeChange,
  onStatusChange,
  onCourseChange,
  onSortChange,
  onClear,
  hasActiveFilters,
  courses,
}: {
  typeFilter: TaskType | "ALL";
  statusFilter: Status | "ALL";
  courseFilter: string;
  sortKey: SortKey;
  onTypeChange: (v: TaskType | "ALL") => void;
  onStatusChange: (v: Status | "ALL") => void;
  onCourseChange: (v: string) => void;
  onSortChange: (v: SortKey) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  courses: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-card/40 px-4 py-3">
      <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

      {/* Type filter */}
      <select
        id="task-filter-type"
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value as TaskType | "ALL")}
        className={cn(
          "rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all",
          typeFilter !== "ALL" && "border-primary/50 text-primary"
        )}
        aria-label="Filter by task type"
      >
        <option value="ALL">All Types</option>
        {TASK_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {/* Status filter */}
      <select
        id="task-filter-status"
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value as Status | "ALL")}
        className={cn(
          "rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all",
          statusFilter !== "ALL" && "border-primary/50 text-primary"
        )}
        aria-label="Filter by status"
      >
        <option value="ALL">All Statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s.replace("_", " ")}</option>
        ))}
      </select>

      {/* Course filter */}
      {courses.length > 0 && (
        <select
          id="task-filter-course"
          value={courseFilter}
          onChange={(e) => onCourseChange(e.target.value)}
          className={cn(
            "rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all",
            courseFilter !== "" && "border-primary/50 text-primary"
          )}
          aria-label="Filter by course"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}

      {/* Separator */}
      <div className="w-px h-4 bg-border/50 hidden sm:block" />

      {/* Sort */}
      <div className="flex items-center gap-1.5">
        <ArrowUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
        <select
          id="task-sort"
          value={sortKey}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          aria-label="Sort tasks by"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>Sort: {o.label}</option>
          ))}
        </select>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          id="task-filter-clear"
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 rounded"
          aria-label="Clear all filters"
        >
          <XIcon className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  onStatusToggle,
  onDelete,
  onEdit,
  onSubTaskToggle,
}: {
  task: TaskWithPriority;
  onStatusToggle: (task: TaskWithPriority) => void;
  onDelete: (task: TaskWithPriority) => void;
  onEdit: (task: TaskWithPriority) => void;
  onSubTaskToggle: (task: TaskWithPriority, subTaskId: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const deadline = toDate(task.deadline);
  const hoursLeft = (deadline.getTime() - Date.now()) / 3_600_000;
  const StatusIcon = STATUS_ICON[task.status];
  const tier = getUrgencyTier(task);
  const subTasks = task.subTasks ?? [];
  const doneCount = subTasks.filter((s) => s.status === "DONE").length;
  const totalCount = subTasks.length;
  const subPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const allDone = totalCount > 0 && doneCount === totalCount;

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(task);
    setDeleting(false);
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card/60",
        "hover:bg-card hover:border-border transition-all duration-200",
        TIER_CONFIG[tier].borderClass,
        task.status === "DONE" && "opacity-60"
      )}
    >
      {/* Status toggle */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            id={`task-status-${task.id}`}
            onClick={() => onStatusToggle(task)}
            className={cn(
              "shrink-0 transition-all duration-200 hover:scale-110",
              STATUS_COLOR[task.status]
            )}
            aria-label={`Status: ${task.status}. Click to advance.`}
          >
            <StatusIcon className="h-5 w-5" />
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            <p>Click to mark as <strong>{STATUS_CYCLE[task.status].replace("_", " ")}</strong></p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Task info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-sm font-semibold text-foreground truncate",
              task.status === "DONE" && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </span>
          <Badge className={cn("text-[10px] px-1.5 py-0 border shrink-0", TYPE_COLOR[task.type])}>
            {task.type}
          </Badge>
          {task.weightage && (
            <span className="text-[10px] text-muted-foreground/70 shrink-0 font-mono">{task.weightage}%</span>
          )}
          {/* Subtask progress badge */}
          {totalCount > 0 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className={cn(
                "flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border shrink-0 transition-colors",
                allDone
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-primary/10 text-primary/80 border-primary/20 hover:bg-primary/20"
              )}
              aria-label={expanded ? "Hide subtasks" : "Show subtasks"}
            >
              <ListChecks className="h-2.5 w-2.5" />
              {doneCount}/{totalCount}
              {expanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground/80 font-mono tracking-wide">{task.courseCode}</span>
          {task.location && (
            <span className="text-xs text-muted-foreground/70">📍 {task.location}</span>
          )}
          <span className="text-xs text-muted-foreground/70">
            {format(deadline, "MMM d, yyyy 'at' h:mm a")}
          </span>
        </div>
        {/* Expandable subtask list */}
        {expanded && totalCount > 0 && (
          <div className="mt-3 rounded-lg border border-border/40 bg-muted/10 p-2.5 space-y-1">
            {subTasks.map((sub) => (
              <button
                key={sub.id}
                onClick={() => onSubTaskToggle(task, sub.id)}
                className="w-full flex items-center gap-2 text-left rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors group"
                aria-label={`${sub.status === "DONE" ? "Uncheck" : "Check"} ${sub.title}`}
              >
                {sub.status === "DONE" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 transition-transform group-hover:scale-110" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 transition-transform group-hover:scale-110" />
                )}
                <span className={cn(
                  "text-xs leading-snug",
                  sub.status === "DONE" ? "text-muted-foreground/60 line-through" : "text-foreground/90"
                )}>{sub.title}</span>
              </button>
            ))}
            <div className="px-2 pt-1.5 space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground/60">
                <span>{doneCount} of {totalCount} topics done</span>
                <span>{subPct}%</span>
              </div>
              <Progress value={subPct} className="h-1" />
            </div>
            {allDone && task.status !== "DONE" && (
              <p className="text-[10px] text-emerald-400/80 px-2 pt-1">
                ✓ All topics covered — consider marking this task as Done.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Urgency + controls */}
      <div className="shrink-0 flex items-center gap-3">
        {task.status !== "DONE" && (
          <div className="text-right hidden sm:block">
            <p
              className={cn(
                "text-xs font-mono font-semibold",
                hoursLeft < 24
                  ? "text-[oklch(0.65_0.22_25)]"
                  : hoursLeft < 72
                    ? "text-[oklch(0.72_0.18_55)]"
                    : "text-muted-foreground"
              )}
            >
              {formatDistanceToNow(deadline, { addSuffix: true })}
            </p>
            <p className="text-[10px] text-muted-foreground">
              P: {task.priority < 1 ? task.priority.toFixed(3) : task.priority.toFixed(2)}
            </p>
          </div>
        )}

        {/* Edit + Delete */}
        <div className="shrink-0 flex items-center gap-1">
          {/* Edit */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                id={`task-edit-${task.id}`}
                onClick={() => onEdit(task)}
                className={cn(
                  "opacity-0 group-hover:opacity-100 shrink-0 p-1.5 rounded-md",
                  "text-muted-foreground hover:text-primary hover:bg-primary/10",
                  "transition-all duration-200"
                )}
                aria-label={`Edit ${task.title}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                <p>Edit task</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Delete */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                id={`task-delete-${task.id}`}
                onClick={handleDelete}
                disabled={deleting}
                className={cn(
                  "opacity-0 group-hover:opacity-100 shrink-0 p-1.5 rounded-md",
                  "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                  "transition-all duration-200 disabled:opacity-40"
                )}
                aria-label={`Delete ${task.title}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                <p>Delete task</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

// ─── Tier Section ─────────────────────────────────────────────────────────────

function TierSection({
  tier,
  tasks,
  onStatusToggle,
  onDelete,
  onEdit,
  onSubTaskToggle,
}: {
  tier: "critical" | "urgent" | "upcoming" | "done";
  tasks: TaskWithPriority[];
  onStatusToggle: (task: TaskWithPriority) => void;
  onDelete: (task: TaskWithPriority) => void;
  onEdit: (task: TaskWithPriority) => void;
  onSubTaskToggle: (task: TaskWithPriority, subTaskId: string) => void;
}) {
  const config = TIER_CONFIG[tier];
  const TierIcon = config.icon;

  if (tasks.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className={cn("flex items-center gap-2 text-xs font-semibold uppercase tracking-widest", config.headerClass)}>
        <TierIcon className="h-3.5 w-3.5" />
        <span>{config.label}</span>
        <span className="text-muted-foreground/70 font-normal normal-case tracking-normal ml-0.5">({tasks.length})</span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onStatusToggle={onStatusToggle}
            onDelete={onDelete}
            onEdit={onEdit}
            onSubTaskToggle={onSubTaskToggle}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { user } = useAuth();
  const { tasks, loading } = useTasks();
  const [addOpen, setAddOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskWithPriority | null>(null);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<TaskType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");
  const [courseFilter, setCourseFilter] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("deadline");

  const handleStatusToggle = async (task: TaskWithPriority) => {
    if (!user) return;
    const nextStatus = STATUS_CYCLE[task.status];
    await updateDoc<{ status: Status }>("tasks", task.id, { status: nextStatus });
  };

  const handleDelete = async (task: TaskWithPriority) => {
    if (!user) return;
    await deleteDoc("tasks", task.id);
  };

  const handleSubTaskToggle = async (task: TaskWithPriority, subTaskId: string) => {
    if (!user) return;
    const updated: SubTask[] = (task.subTasks ?? []).map((s) =>
      s.id === subTaskId
        ? { ...s, status: s.status === "DONE" ? ("TODO" as const) : ("DONE" as const) }
        : s
    );
    await updateDoc<{ subTasks: SubTask[] }>("tasks", task.id, { subTasks: updated });
  };

  // Unique course codes for filter dropdown
  const courses = useMemo(
    () => [...new Set(tasks.map((t) => t.courseCode))].sort(),
    [tasks]
  );

  const hasActiveFilters = typeFilter !== "ALL" || statusFilter !== "ALL" || courseFilter !== "";

  // Apply filters + sort
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (typeFilter !== "ALL") result = result.filter((t) => t.type === typeFilter);
    if (statusFilter !== "ALL") result = result.filter((t) => t.status === statusFilter);
    if (courseFilter !== "") result = result.filter((t) => t.courseCode === courseFilter);

    result.sort((a, b) => {
      switch (sortKey) {
        case "deadline": {
          const aD = toDate(a.deadline).getTime();
          const bD = toDate(b.deadline).getTime();
          return aD - bD;
        }
        case "priority":
          return b.priority - a.priority;
        case "importance":
          return b.importance - a.importance;
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [tasks, typeFilter, statusFilter, courseFilter, sortKey]);

  // Bucket filtered tasks by tier
  const critical = filteredTasks.filter((t) => getUrgencyTier(t) === "critical");
  const urgent = filteredTasks.filter((t) => getUrgencyTier(t) === "urgent");
  const upcoming = filteredTasks.filter((t) => getUrgencyTier(t) === "upcoming");
  const done = filteredTasks.filter((t) => getUrgencyTier(t) === "done");

  // Stats based on ALL tasks (not filtered)
  const pending = tasks.filter((t) => t.status !== "DONE").length;
  const completedCount = tasks.filter((t) => t.status === "DONE").length;
  const allCritical = tasks.filter((t) => getUrgencyTier(t) === "critical").length;
  const allUrgent = tasks.filter((t) => getUrgencyTier(t) === "urgent").length;
  const allUpcoming = tasks.filter((t) => getUrgencyTier(t) === "upcoming").length;

  const handleExport = () => {
    exportTasksToCSV(tasks.filter((t) => t.status !== "DONE").concat(tasks.filter((t) => t.status === "DONE")));
  };

  const clearFilters = () => {
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setCourseFilter("");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            Tasks
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? "Loading…" : `${pending} pending · ${completedCount} completed`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {!loading && tasks.length > 0 && (
            <Button
              id="tasks-export-btn"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleExport}
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          )}
          <Button
            id="tasks-add-btn"
            size="sm"
            className="gap-2"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Stats mini-bar */}
      {!loading && tasks.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Critical", count: allCritical, color: "text-[oklch(0.65_0.22_25)]", bg: "bg-[oklch(0.65_0.22_25)]/10" },
            { label: "Urgent", count: allUrgent, color: "text-[oklch(0.72_0.18_55)]", bg: "bg-[oklch(0.72_0.18_55)]/10" },
            { label: "Upcoming", count: allUpcoming, color: "text-primary", bg: "bg-primary/10" },
            { label: "Done", count: completedCount, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className={cn("rounded-xl px-4 py-3 flex flex-col", bg)}>
              <span className={cn("text-2xl font-bold", color)}>{count}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      {!loading && tasks.length > 0 && (
        <FilterBar
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          courseFilter={courseFilter}
          sortKey={sortKey}
          onTypeChange={setTypeFilter}
          onStatusChange={setStatusFilter}
          onCourseChange={setCourseFilter}
          onSortChange={setSortKey}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
          courses={courses}
        />
      )}

      {/* Task list */}
      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" />
            {hasActiveFilters
              ? `${filteredTasks.length} of ${tasks.length} tasks — click the status icon to advance`
              : "Sorted by urgency — click the status icon to advance"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <SkeletonCard key={i} rows={1} showHeader className="h-16 p-3" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <CheckSquare className="h-8 w-8 text-primary/50" />
              </div>
              <div>
                <p className="text-foreground font-medium">No tasks yet</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Add your first exam, assignment, or deadline to get started.
                </p>
              </div>
              <Button
                id="tasks-empty-add-btn"
                onClick={() => setAddOpen(true)}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Add your first task
              </Button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-center">
              <Filter className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-foreground font-medium">No tasks match filters</p>
              <p className="text-muted-foreground text-sm">Try adjusting your filter criteria.</p>
              <button
                onClick={clearFilters}
                className="text-xs text-primary hover:underline mt-1"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <TierSection tier="critical" tasks={critical} onStatusToggle={handleStatusToggle} onDelete={handleDelete} onEdit={setEditTask} onSubTaskToggle={handleSubTaskToggle} />
              <TierSection tier="urgent" tasks={urgent} onStatusToggle={handleStatusToggle} onDelete={handleDelete} onEdit={setEditTask} onSubTaskToggle={handleSubTaskToggle} />
              <TierSection tier="upcoming" tasks={upcoming} onStatusToggle={handleStatusToggle} onDelete={handleDelete} onEdit={setEditTask} onSubTaskToggle={handleSubTaskToggle} />
              <TierSection tier="done" tasks={done} onStatusToggle={handleStatusToggle} onDelete={handleDelete} onEdit={setEditTask} onSubTaskToggle={handleSubTaskToggle} />
            </>
          )}
        </CardContent>
      </Card>

      <AddTaskDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditTaskDialog
        task={editTask}
        open={editTask !== null}
        onOpenChange={(open) => { if (!open) setEditTask(null); }}
      />
    </div>
  );
}
