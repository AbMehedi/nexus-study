"use client";

import { useState } from "react";
import type { TaskWithPriority } from "@/lib/types";
import type { Sprint } from "@/lib/types";
import { generateSprints } from "@/lib/sprint-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, parse, isValid } from "date-fns";
import {
  CalendarClock,
  Plus,
  Trash2,
  Zap,
  Play,
  Clock,
  AlertTriangle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeBlock {
  id: string;
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

interface SprintWithTask extends Sprint {
  task: TaskWithPriority;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTimeToDate(timeStr: string, base: Date): Date {
  const parsed = parse(timeStr, "HH:mm", base);
  return isValid(parsed) ? parsed : base;
}

const TYPE_COLOR: Record<string, string> = {
  EXAM: "bg-red-500/15 text-red-400 border-red-500/20",
  ASSIGNMENT: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  PROJECT: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  PRESENTATION: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
};

const TYPE_BAR: Record<string, string> = {
  EXAM: "bg-red-400",
  ASSIGNMENT: "bg-blue-400",
  PROJECT: "bg-purple-400",
  PRESENTATION: "bg-yellow-400",
};

// ─── TimeBlockEditor ──────────────────────────────────────────────────────────

function TimeBlockRow({
  block,
  onUpdate,
  onRemove,
  canRemove,
}: {
  block: TimeBlock;
  onUpdate: (id: string, field: "start" | "end", value: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}) {
  return (
    <div className="flex items-center gap-2 group">
      <div className="flex items-center gap-2 flex-1 rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <input
          type="time"
          value={block.start}
          onChange={(e) => onUpdate(block.id, "start", e.target.value)}
          className="bg-transparent text-sm text-foreground focus:outline-none w-24"
          aria-label="Block start time"
        />
        <span className="text-muted-foreground text-xs">→</span>
        <input
          type="time"
          value={block.end}
          onChange={(e) => onUpdate(block.id, "end", e.target.value)}
          className="bg-transparent text-sm text-foreground focus:outline-none w-24"
          aria-label="Block end time"
        />
      </div>
      {canRemove && (
        <button
          onClick={() => onRemove(block.id)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
          aria-label="Remove time block"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Sprint Card ──────────────────────────────────────────────────────────────

function SprintCard({ sprint, isSurvivalMode }: { sprint: SprintWithTask; isSurvivalMode: boolean }) {
  const endTime = new Date(sprint.startTime.getTime() + sprint.durationMinutes * 60_000);

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card/60 p-4 flex items-start gap-4 animate-fade-in-up",
        "hover:border-primary/30 hover:bg-card transition-all duration-200"
      )}
    >
      {/* Type bar */}
      <div className={cn("w-1 self-stretch rounded-full shrink-0", TYPE_BAR[sprint.task.type])} />

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground truncate">{sprint.title}</span>
          <Badge className={cn("text-[10px] px-1.5 py-0 border shrink-0", TYPE_COLOR[sprint.task.type])}>
            {sprint.task.type}
          </Badge>
          {isSurvivalMode && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary shrink-0">
              ⚡ Survival
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{sprint.task.courseCode}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Play className="h-3 w-3" />
            {format(sprint.startTime, "h:mm a")}
          </span>
          <span>→</span>
          <span>{format(endTime, "h:mm a")}</span>
        </div>
      </div>

      {/* Duration badge */}
      <div className="shrink-0 flex flex-col items-center justify-center rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 min-w-[56px]">
        <span className="text-lg font-bold text-primary">{sprint.durationMinutes}</span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">min</span>
      </div>
    </div>
  );
}

// ─── GapFinder ────────────────────────────────────────────────────────────────

interface GapFinderProps {
  tasks: TaskWithPriority[];
  isSurvivalMode: boolean;
}

export function GapFinder({ tasks, isSurvivalMode }: GapFinderProps) {
  const [blocks, setBlocks] = useState<TimeBlock[]>([
    { id: "1", start: "09:00", end: "11:00" },
    { id: "2", start: "14:00", end: "16:00" },
  ]);
  const [sprints, setSprints] = useState<SprintWithTask[]>([]);
  const [generated, setGenerated] = useState(false);

  const addBlock = () => {
    const id = String(Date.now());
    setBlocks((b) => [...b, { id, start: "18:00", end: "20:00" }]);
  };

  const updateBlock = (id: string, field: "start" | "end", value: string) => {
    setBlocks((b) => b.map((block) => (block.id === id ? { ...block, [field]: value } : block)));
  };

  const removeBlock = (id: string) => {
    setBlocks((b) => b.filter((block) => block.id !== id));
  };

  const handleGenerate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const freeBlocks = blocks
      .filter((b) => b.start && b.end && b.start < b.end)
      .map((b) => ({
        start: parseTimeToDate(b.start, today),
        end: parseTimeToDate(b.end, today),
      }));

    if (freeBlocks.length === 0) return;

    // Take top 3 pending tasks by priority
    const topTasks = [...tasks]
      .filter((t) => t.status !== "DONE")
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);

    const result: SprintWithTask[] = [];
    const mode = isSurvivalMode ? "survival" : "normal";

    topTasks.forEach((task) => {
      const taskSprints = generateSprints(task, freeBlocks, { mode });
      taskSprints.forEach((s) => result.push({ ...s, task }));
    });

    // Sort by start time
    result.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    setSprints(result);
    setGenerated(true);
  };

  const pendingTasks = tasks.filter((t) => t.status !== "DONE");
  const totalSprintMinutes = sprints.reduce((acc, s) => acc + s.durationMinutes, 0);

  return (
    <div className="space-y-6">
      {/* Free blocks editor */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4 text-primary" />
                Today&apos;s Free Blocks
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Define when you&apos;re available to study today
                {isSurvivalMode && (
                  <span className="ml-1.5 text-primary font-semibold">⚡ Survival Mode: 25-min sprints</span>
                )}
              </p>
            </div>
            <Button
              id="gap-finder-add-block-btn"
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={addBlock}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Block
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {blocks.map((block) => (
            <TimeBlockRow
              key={block.id}
              block={block}
              onUpdate={updateBlock}
              onRemove={removeBlock}
              canRemove={blocks.length > 1}
            />
          ))}

          <div className="pt-2 flex items-center justify-between">
            {pendingTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
                No pending tasks — add tasks first
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Will generate sprints for your top {Math.min(3, pendingTasks.length)} priority task
                {pendingTasks.length > 1 ? "s" : ""}
              </p>
            )}
            <Button
              id="gap-finder-generate-btn"
              size="sm"
              className="gap-2"
              onClick={handleGenerate}
              disabled={pendingTasks.length === 0}
            >
              <Zap className="h-3.5 w-3.5" />
              Generate Sprints
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated sprints */}
      {generated && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Study Sprint Plan
            </h2>
            {sprints.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {sprints.length} sprint{sprints.length !== 1 ? "s" : ""} · {totalSprintMinutes} min total
              </span>
            )}
          </div>

          {sprints.length === 0 ? (
            <div className="rounded-xl border border-border/50 bg-card/40 p-8 flex flex-col items-center gap-3 text-center">
              <AlertTriangle className="h-8 w-8 text-yellow-400/50" />
              <div>
                <p className="text-sm font-medium text-foreground">No sprints generated</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your free blocks may be too short (minimum 25 min), or all tasks are done.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sprints.map((sprint) => (
                <SprintCard
                  key={sprint.id}
                  sprint={sprint}
                  isSurvivalMode={isSurvivalMode}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
