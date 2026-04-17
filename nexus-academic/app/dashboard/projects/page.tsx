"use client";

import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { AddProjectDialog } from "@/components/dashboard/AddProjectDialog";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";
import { FolderKanban, Plus, ChevronRight } from "lucide-react";

type Phase = Project["phase"];

const PHASES: { key: Phase; label: string; color: string; bgColor: string }[] = [
  { key: "REQUIREMENT", label: "Requirement", color: "text-blue-400", bgColor: "border-t-blue-500/60" },
  { key: "IMPLEMENTATION", label: "Implementation", color: "text-purple-400", bgColor: "border-t-purple-500/60" },
  { key: "DOCUMENTATION", label: "Documentation", color: "text-yellow-400", bgColor: "border-t-yellow-500/60" },
  { key: "SUBMISSION", label: "Submitted", color: "text-emerald-400", bgColor: "border-t-emerald-500/60" },
];

export default function ProjectsPage() {
  const { projects, loading } = useProjects();
  const [addOpen, setAddOpen] = useState(false);

  const projectsByPhase = (phase: Phase) =>
    projects.filter((p) => p.phase === phase);

  const totalActive = projects.filter((p) => p.phase !== "SUBMISSION").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-primary" />
            Projects
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading
              ? "Loading…"
              : `${totalActive} active · ${projects.length} total`}
          </p>
        </div>
        <Button
          id="projects-add-btn"
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      {/* Phase flow diagram */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {PHASES.map((phase, idx) => (
          <div key={phase.key} className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5">
              <span className={cn("text-[11px] font-semibold", phase.color)}>{phase.label}</span>
              {!loading && (
                <Badge
                  variant="outline"
                  className={cn("text-[9px] px-1.5 py-0 h-4 border-border/40", phase.color)}
                >
                  {projectsByPhase(phase.key).length}
                </Badge>
              )}
            </div>
            {idx < PHASES.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            )}
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <SkeletonCard rows={2} showHeader />
              <SkeletonCard rows={1} showHeader />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center py-24 gap-5 text-center">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FolderKanban className="h-10 w-10 text-primary/40" />
          </div>
          <div>
            <p className="text-foreground font-semibold text-lg">No projects yet</p>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
              Add your first project — Academic Nexus will auto-generate the 4-stage breakdown for you.
            </p>
          </div>
          <Button
            id="projects-empty-add-btn"
            onClick={() => setAddOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add your first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {PHASES.map((phase) => {
            const phaseProjects = projectsByPhase(phase.key);
            return (
              <div key={phase.key} className="space-y-3">
                {/* Column header */}
                <div
                  className={cn(
                    "rounded-t-xl border border-border/50 bg-card/40 px-3 py-2.5 border-t-2",
                    phase.bgColor
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs font-bold uppercase tracking-wider", phase.color)}>
                      {phase.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {phaseProjects.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-3 min-h-[120px]">
                  {phaseProjects.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/40 p-6 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground/50">No projects</p>
                    </div>
                  ) : (
                    phaseProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddProjectDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
