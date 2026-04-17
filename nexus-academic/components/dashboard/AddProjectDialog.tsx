"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { addDoc } from "@/lib/firestore-service";
import type { Project, SubTask } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function InputField({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
      )}
    />
  );
}

// Default 4-stage sub-tasks suggested automatically
const DEFAULT_SUBTASKS: Omit<SubTask, "id">[] = [
  { title: "Requirement Analysis", status: "TODO" },
  { title: "Core Implementation", status: "TODO" },
  { title: "Documentation & Report", status: "TODO" },
  { title: "Final Review & Submission", status: "TODO" },
];

export function AddProjectDialog({ open, onOpenChange }: AddProjectDialogProps) {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [deadline, setDeadline] = useState("");
  const [repoLink, setRepoLink] = useState("");
  const [docsLink, setDocsLink] = useState("");
  const [subTasks, setSubTasks] = useState<{ id: string; title: string; status: "TODO" }[]>(
    DEFAULT_SUBTASKS.map((s, i) => ({ ...s, id: `default-${i}`, status: "TODO" as const }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setCourseCode("");
    setDeadline("");
    setRepoLink("");
    setDocsLink("");
    setSubTasks(DEFAULT_SUBTASKS.map((s, i) => ({ ...s, id: `default-${i}`, status: "TODO" as const })));
    setError(null);
  };

  const handleClose = (val: boolean) => {
    if (!submitting) {
      reset();
      onOpenChange(val);
    }
  };

  const addSubTask = () => {
    const id = String(Date.now());
    setSubTasks((s) => [...s, { id, title: "", status: "TODO" as const }]);
  };

  const updateSubTask = (id: string, title: string) => {
    setSubTasks((s) => s.map((st) => (st.id === id ? { ...st, title } : st)));
  };

  const removeSubTask = (id: string) => {
    setSubTasks((s) => s.filter((st) => st.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !courseCode.trim() || !deadline) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const validSubTasks: SubTask[] = subTasks
        .filter((s) => s.title.trim())
        .map((s) => ({ id: s.id, title: s.title.trim(), status: "TODO" as const }));

      const projectData: Omit<Project, "id"> = {
        title: title.trim(),
        courseCode: courseCode.trim().toUpperCase(),
        deadline: new Date(deadline),
        phase: "REQUIREMENT",
        subTasks: validSubTasks,
        userId: user.uid,
        createdAt: new Date(),
        ...(repoLink.trim() && { repoLink: repoLink.trim() }),
        ...(docsLink.trim() && { docsLink: docsLink.trim() }),
      };

      await addDoc<Omit<Project, "id">>("projects", projectData);
      reset();
      onOpenChange(false);
    } catch (err) {
      setError("Failed to save project. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border/60 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-primary" />
            Add New Project
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Starts in the Requirement phase with the 4-stage breakdown pre-loaded.
          </DialogDescription>
        </DialogHeader>

        <form id="add-project-form" onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Title */}
          <Field label="Project Title" required>
            <InputField
              id="project-title"
              value={title}
              onChange={setTitle}
              placeholder="e.g. Hospital Management System"
            />
          </Field>

          {/* Course Code + Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Course Code" required>
              <InputField
                id="project-course-code"
                value={courseCode}
                onChange={setCourseCode}
                placeholder="e.g. CSE401"
              />
            </Field>
            <Field label="Deadline" required>
              <InputField
                id="project-deadline"
                type="datetime-local"
                value={deadline}
                onChange={setDeadline}
              />
            </Field>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Repo Link" hint="Optional">
              <InputField
                id="project-repo-link"
                value={repoLink}
                onChange={setRepoLink}
                placeholder="https://github.com/..."
              />
            </Field>
            <Field label="Docs Link" hint="Optional">
              <InputField
                id="project-docs-link"
                value={docsLink}
                onChange={setDocsLink}
                placeholder="https://docs.google.com/..."
              />
            </Field>
          </div>

          {/* Subtasks */}
          <Field
            label="Subtasks"
            hint="These will appear as a checklist on your project card."
          >
            <div className="space-y-2">
              {subTasks.map((st, idx) => (
                <div key={st.id} className="flex items-center gap-2 group">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}.</span>
                  <input
                    type="text"
                    value={st.title}
                    onChange={(e) => updateSubTask(st.id, e.target.value)}
                    placeholder={`Subtask ${idx + 1}`}
                    className={cn(
                      "flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60",
                      "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
                    )}
                  />
                  {subTasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubTask(st.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                      aria-label="Remove subtask"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                id="add-subtask-btn"
                type="button"
                variant="ghost"
                size="sm"
                onClick={addSubTask}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
                Add subtask
              </Button>
            </div>
          </Field>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">
              {error}
            </p>
          )}
        </form>

        <DialogFooter className="gap-2 pt-2">
          <Button
            id="add-project-cancel-btn"
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => handleClose(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            id="add-project-submit-btn"
            type="submit"
            form="add-project-form"
            size="sm"
            disabled={submitting}
            className="gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Create Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
