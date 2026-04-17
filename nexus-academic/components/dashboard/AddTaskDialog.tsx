"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { addDoc } from "@/lib/firestore-service";
import type { Task, SubTask } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Loader2, Plus, X, ListChecks, GripVertical } from "lucide-react";

type TaskType = Task["type"];

const MAX_SUBTASKS = 20;

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TASK_TYPES: { value: TaskType; label: string; color: string }[] = [
  { value: "EXAM", label: "Exam", color: "bg-red-500/15 text-red-400 border-red-500/20" },
  { value: "ASSIGNMENT", label: "Assignment", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  { value: "PROJECT", label: "Project", color: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
  { value: "PRESENTATION", label: "Presentation", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
];

// ─── Shared Field wrapper ─────────────────────────────────────────────────────

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
      <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1">
        {label}
        {required && <span className="text-red-400 text-[10px]">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/80 leading-snug">{hint}</p>}
    </div>
  );
}

function InputField({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className={cn(
        "w-full rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50",
        "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all duration-200"
      )}
    />
  );
}

// ─── Subtask Editor ───────────────────────────────────────────────────────────

interface SubTaskDraft {
  localId: string; // client-only key for React
  title: string;
}

function SubTaskEditor({
  items,
  onChange,
}: {
  items: SubTaskDraft[];
  onChange: (items: SubTaskDraft[]) => void;
}) {
  const addItem = () => {
    if (items.length >= MAX_SUBTASKS) return;
    onChange([...items, { localId: crypto.randomUUID(), title: "" }]);
  };

  const removeItem = (localId: string) => {
    onChange(items.filter((i) => i.localId !== localId));
  };

  const updateTitle = (localId: string, title: string) => {
    onChange(items.map((i) => (i.localId === localId ? { ...i, title } : i)));
  };

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-3 text-xs text-muted-foreground/70">
          <ListChecks className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          <span>No subtasks yet — add topics or checklist items below</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, idx) => (
            <div key={item.localId} className="flex items-center gap-2 group">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
              <span className="text-[10px] text-muted-foreground/50 w-4 shrink-0 text-right font-mono">
                {idx + 1}
              </span>
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateTitle(item.localId, e.target.value)}
                placeholder={`e.g. ${["MIPS Architecture", "Cache Memory", "Pipelining", "Virtual Memory"][idx % 4]}`}
                maxLength={120}
                className={cn(
                  "flex-1 rounded-md border border-border/60 bg-background/50 px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/40",
                  "focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/50 transition-all"
                )}
              />
              <button
                type="button"
                onClick={() => removeItem(item.localId)}
                className="shrink-0 p-1 rounded-md text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Remove subtask"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addItem}
        disabled={items.length >= MAX_SUBTASKS}
        className={cn(
          "flex items-center gap-1.5 text-xs rounded-md px-2.5 py-1.5 transition-all",
          items.length >= MAX_SUBTASKS
            ? "text-muted-foreground/30 cursor-not-allowed"
            : "text-primary/80 hover:text-primary hover:bg-primary/10 font-medium"
        )}
      >
        <Plus className="h-3 w-3" />
        Add topic / subtask
        {items.length > 0 && (
          <span className="text-muted-foreground/50 font-normal">
            ({items.length}/{MAX_SUBTASKS})
          </span>
        )}
      </button>
    </div>
  );
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

export function AddTaskDialog({ open, onOpenChange }: AddTaskDialogProps) {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [type, setType] = useState<TaskType>("ASSIGNMENT");
  const [deadline, setDeadline] = useState("");
  const [importance, setImportance] = useState(5);
  const [location, setLocation] = useState("");
  const [weightage, setWeightage] = useState("");
  const [subTaskDrafts, setSubTaskDrafts] = useState<SubTaskDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setCourseCode("");
    setType("ASSIGNMENT");
    setDeadline("");
    setImportance(5);
    setLocation("");
    setWeightage("");
    setSubTaskDrafts([]);
    setError(null);
  };

  const handleClose = (val: boolean) => {
    if (!submitting) {
      reset();
      onOpenChange(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !courseCode.trim() || !deadline) {
      setError("Please fill in all required fields.");
      return;
    }

    // Filter out blank subtask rows
    const validSubTasks: SubTask[] = subTaskDrafts
      .filter((d) => d.title.trim().length > 0)
      .map((d) => ({ id: crypto.randomUUID(), title: d.title.trim(), status: "TODO" as const }));

    setSubmitting(true);
    setError(null);

    try {
      // Firestore rejects undefined values at runtime — use conditional spread
      const taskData: Record<string, unknown> = {
        title: title.trim(),
        courseCode: courseCode.trim().toUpperCase(),
        type,
        deadline: new Date(deadline),
        importance,
        status: "TODO",
        userId: user.uid,
        createdAt: new Date(),
        subTasks: validSubTasks,
      };
      if (location.trim()) taskData.location = location.trim();
      if (weightage && !isNaN(Number(weightage))) taskData.weightage = Number(weightage);

      await addDoc<Record<string, unknown>>("tasks", taskData);
      reset();
      onOpenChange(false);
    } catch (err) {
      setError("Failed to save task. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedType = TASK_TYPES.find((t) => t.value === type);
  const importanceLabel =
    importance <= 3 ? "Low" : importance <= 6 ? "Medium" : importance <= 8 ? "High" : "Critical";
  const importanceLabelColor =
    importance <= 3
      ? "text-muted-foreground"
      : importance <= 6
        ? "text-yellow-400"
        : importance <= 8
          ? "text-orange-400"
          : "text-red-400";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border/60 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Plus className="h-4 w-4 text-primary" />
            Add New Task
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground/80">
            Track an exam, assignment, project, or presentation — with optional study subtasks.
          </DialogDescription>
        </DialogHeader>

        <form id="add-task-form" onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Title */}
          <Field label="Task Title" required>
            <InputField
              id="task-title"
              value={title}
              onChange={setTitle}
              placeholder="e.g. Midterm Exam — Data Structures"
              required
            />
          </Field>

          {/* Course Code + Type */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Course Code" required>
              <InputField
                id="task-course-code"
                value={courseCode}
                onChange={setCourseCode}
                placeholder="e.g. CSE301"
                required
              />
            </Field>
            <Field label="Task Type" required>
              <Select value={type} onValueChange={(v) => setType(v as TaskType)}>
                <SelectTrigger
                  id="task-type-select"
                  className="bg-background/60 border-border/70 focus:ring-primary/40"
                >
                  <SelectValue>
                    {selectedType && (
                      <Badge className={cn("text-[10px] px-2 py-0 border", selectedType.color)}>
                        {selectedType.label}
                      </Badge>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="focus:bg-muted/40">
                      <Badge className={cn("text-[10px] px-2 py-0 border", t.color)}>
                        {t.label}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Deadline */}
          <Field label="Deadline" required>
            <InputField
              id="task-deadline"
              type="datetime-local"
              value={deadline}
              onChange={setDeadline}
              required
            />
          </Field>

          {/* Importance Slider */}
          <Field
            label="Importance"
            hint="Priority score = importance ÷ hours remaining. Higher = shown first."
          >
            <div className="flex items-center gap-4 pt-1">
              <Slider
                id="task-importance-slider"
                min={1}
                max={10}
                step={1}
                value={[importance]}
                onValueChange={(v) => setImportance(Array.isArray(v) ? (v as number[])[0] : (v as number))}
                className="flex-1"
              />
              <div className="flex items-baseline gap-1.5 min-w-[75px]">
                <span className="text-lg font-bold text-foreground">{importance}</span>
                <span className={cn("text-xs font-semibold", importanceLabelColor)}>
                  {importanceLabel}
                </span>
              </div>
            </div>
          </Field>

          {/* Optional fields */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location" hint="Optional — exam hall, room, etc.">
              <InputField
                id="task-location"
                value={location}
                onChange={setLocation}
                placeholder="e.g. Hall-3, Room 201"
              />
            </Field>
            <Field label="Weightage %" hint="Optional — grade weight">
              <InputField
                id="task-weightage"
                type="number"
                value={weightage}
                onChange={setWeightage}
                placeholder="e.g. 30"
              />
            </Field>
          </div>

          {/* ── Subtasks ─────────────────────────────────────────────────── */}
          <div className="rounded-xl border border-border/50 bg-muted/10 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="h-3.5 w-3.5 text-primary/70" />
                <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Study Topics / Subtasks
                </span>
              </div>
              {subTaskDrafts.filter((d) => d.title.trim()).length > 0 && (
                <span className="text-[10px] text-emerald-400 font-medium">
                  {subTaskDrafts.filter((d) => d.title.trim()).length} topic
                  {subTaskDrafts.filter((d) => d.title.trim()).length !== 1 ? "s" : ""} added
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground/70 leading-snug">
              Break this task into topics you need to cover (e.g. MIPS Architecture, Cache Memory). You can check them off as you study.
            </p>
            <SubTaskEditor items={subTaskDrafts} onChange={setSubTaskDrafts} />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
              {error}
            </p>
          )}
        </form>

        <DialogFooter className="gap-2 pt-2">
          <Button
            id="add-task-cancel-btn"
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => handleClose(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            id="add-task-submit-btn"
            type="submit"
            form="add-task-form"
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
                Add Task
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
