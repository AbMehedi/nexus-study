"use client";

import { useState } from "react";
import type { Project, SubTask } from "@/lib/types";
import { updateDoc } from "@/lib/firestore-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronRight,
  ExternalLink,
  GitBranch,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(d: unknown): Date {
  if (d instanceof Date) return d;
  if (d && typeof (d as { toDate?: () => Date }).toDate === "function") {
    return (d as { toDate: () => Date }).toDate();
  }
  return new Date(d as string | number);
}

type Phase = Project["phase"];

const PHASES: Phase[] = ["REQUIREMENT", "IMPLEMENTATION", "DOCUMENTATION", "SUBMISSION"];

const PHASE_LABEL: Record<Phase, string> = {
  REQUIREMENT: "Requirement",
  IMPLEMENTATION: "Implementation",
  DOCUMENTATION: "Documentation",
  SUBMISSION: "Submission",
};

const PHASE_COLOR: Record<Phase, string> = {
  REQUIREMENT: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  IMPLEMENTATION: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  DOCUMENTATION: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  SUBMISSION: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

const PHASE_PROGRESS: Record<Phase, number> = {
  REQUIREMENT: 10,
  IMPLEMENTATION: 40,
  DOCUMENTATION: 75,
  SUBMISSION: 100,
};

function getNextPhase(phase: Phase): Phase | null {
  const idx = PHASES.indexOf(phase);
  return idx < PHASES.length - 1 ? PHASES[idx + 1] : null;
}

// ─── SubTask Row ──────────────────────────────────────────────────────────────

function SubTaskRow({
  subTask,
  onToggle,
}: {
  subTask: SubTask;
  onToggle: (id: string) => void;
}) {
  const isDone = subTask.status === "DONE";
  return (
    <button
      onClick={() => onToggle(subTask.id)}
      className={cn(
        "w-full flex items-center gap-2.5 text-left rounded-lg px-2 py-1.5 transition-colors",
        "hover:bg-muted/40 group"
      )}
      aria-label={`${isDone ? "Uncheck" : "Check"} subtask: ${subTask.title}`}
    >
      {isDone ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 transition-transform group-hover:scale-110" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:scale-110" />
      )}
      <span
        className={cn(
          "text-xs transition-all",
          isDone ? "text-muted-foreground line-through" : "text-foreground"
        )}
      >
        {subTask.title}
      </span>
    </button>
  );
}

// ─── ProjectCard ──────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const deadline = toDate(project.deadline);
  const doneSubTasks = project.subTasks.filter((s) => s.status === "DONE").length;
  const totalSubTasks = project.subTasks.length;
  const subTaskPercent = totalSubTasks > 0 ? Math.round((doneSubTasks / totalSubTasks) * 100) : 0;
  const nextPhase = getNextPhase(project.phase);
  const phaseProgress = PHASE_PROGRESS[project.phase];
  const isSubmitted = project.phase === "SUBMISSION";

  const handleAdvancePhase = async () => {
    if (!nextPhase) return;
    setAdvancing(true);
    try {
      await updateDoc<{ phase: Phase }>("projects", project.id, { phase: nextPhase });
    } finally {
      setAdvancing(false);
    }
  };

  const handleSubTaskToggle = async (subTaskId: string) => {
    const updated = project.subTasks.map((s) =>
      s.id === subTaskId
        ? { ...s, status: s.status === "DONE" ? ("TODO" as const) : ("DONE" as const) }
        : s
    );
    await updateDoc<{ subTasks: SubTask[] }>("projects", project.id, { subTasks: updated });
  };

  return (
    <Card
      className={cn(
        "rounded-xl border border-border/60 bg-card/80 transition-all duration-200",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        isSubmitted && "opacity-70"
      )}
    >
      <CardHeader className="pb-2">
        {/* Phase badge + deadline */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Badge className={cn("text-[10px] px-2 py-0.5 border font-semibold", PHASE_COLOR[project.phase])}>
            {PHASE_LABEL[project.phase]}
          </Badge>
          <span
            className={cn(
              "text-[11px] font-mono",
              (deadline.getTime() - Date.now()) / 3_600_000 < 72
                ? "text-[oklch(0.65_0.22_25)]"
                : "text-muted-foreground"
            )}
          >
            {formatDistanceToNow(deadline, { addSuffix: true })}
          </span>
        </div>

        {/* Title */}
        <CardTitle className="text-sm font-bold text-foreground leading-snug mt-1">
          {project.title}
        </CardTitle>
        <p className="text-xs text-muted-foreground font-mono">{project.courseCode}</p>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Phase progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Project Phase Progress</span>
            <span>{phaseProgress}%</span>
          </div>
          <Progress value={phaseProgress} className="h-1.5" />
        </div>

        {/* Subtasks summary */}
        {totalSubTasks > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Subtasks</span>
              <span>{doneSubTasks}/{totalSubTasks} done ({subTaskPercent}%)</span>
            </div>
            <Progress value={subTaskPercent} className="h-1" />
          </div>
        )}

        {/* Links */}
        <div className="flex items-center gap-2 flex-wrap">
          {project.repoLink && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <a
                      href={project.repoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors rounded px-2 py-1 bg-muted/30 hover:bg-muted/60"
                    >
                      <GitBranch className="h-3 w-3" />
                      Repo
                    </a>
                  }
                />
                <TooltipContent className="text-xs">Open repository</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {project.docsLink && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <a
                      href={project.docsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors rounded px-2 py-1 bg-muted/30 hover:bg-muted/60"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Docs
                    </a>
                  }
                />
                <TooltipContent className="text-xs">Open documentation</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Subtasks expandable */}
        {totalSubTasks > 0 && (
          <div className="border-t border-border/40 pt-3 space-y-1">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {expanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {expanded ? "Hide" : "Show"} subtasks
            </button>
            {expanded && (
              <div className="space-y-0.5 pt-1">
                {project.subTasks.map((sub) => (
                  <SubTaskRow key={sub.id} subTask={sub} onToggle={handleSubTaskToggle} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Advance Phase button */}
        {!isSubmitted && nextPhase && (
          <Button
            id={`project-advance-${project.id}`}
            size="sm"
            variant="outline"
            className="w-full gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60"
            onClick={handleAdvancePhase}
            disabled={advancing}
          >
            {advancing ? (
              "Moving…"
            ) : (
              <>
                Move to {PHASE_LABEL[nextPhase]}
                <ArrowRight className="h-3 w-3" />
              </>
            )}
          </Button>
        )}

        {isSubmitted && (
          <div className="text-center text-xs text-emerald-400 font-semibold py-1">
            ✓ Submitted
          </div>
        )}
      </CardContent>
    </Card>
  );
}
