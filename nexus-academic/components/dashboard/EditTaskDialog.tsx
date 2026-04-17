"use client";

import { useState, useEffect } from "react";
import { updateDoc } from "@/lib/firestore-service";
import type { Task, SubTask } from "@/lib/types";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, Save, Plus, X, ListChecks, GripVertical } from "lucide-react";
import { format } from "date-fns";

type TaskType = Task["type"];
type TaskStatus = Task["status"];

const MAX_SUBTASKS = 20;

const TASK_TYPES: { value: TaskType; label: string; color: string }[] = [
  { value: "EXAM", label: "Exam", color: "bg-red-500/15 text-red-400 border-red-500/20" },
  { value: "ASSIGNMENT", label: "Assignment", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  { value: "PROJECT", label: "Project", color: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
  { value: "PRESENTATION", label: "Presentation", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: "TODO", label: "To Do", color: "text-muted-foreground" },
  { value: "IN_PROGRESS", label: "In Progress", color: "text-yellow-400" },
  { value: "DONE", label: "Done", color: "text-emerald-400" },
];

// ─── Field wrapper ────────────────────────────────────────────────────────────

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
        "w-full rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50",
        "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all duration-200"
      )}
    />
  );
}

function toDatetimeLocal(date: unknown): string {
  let d: Date;
  if (date instanceof Date) {
    d = date;
  } else if (date && typeof (date as { toDate?: () => Date }).toDate === "function") {
    d = (date as { toDate: () => Date }).toDate();
  } else {
    d = new Date(date as string | number);
  }
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

// ─── Subtask editor (shared between Add & Edit) ────────────────────────────────

interface SubTaskDraft {
  localId: string;
  id: string; // Firestore ID — empty string for brand new items
  title: string;
  status: SubTask["status"];
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
    onChange([...items, { localId: crypto.randomUUID(), id: "", title: "", status: "TODO" }]);
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
          <span>No subtasks — add topics or checklist items below</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, idx) => (
            <div key={item.localId} className="flex items-center gap-2 group">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/25 shrink-0" />
              <span className="text-[10px] text-muted-foreground/40 w-4 shrink-0 text-right font-mono">
                {idx + 1}
              </span>
              <div className="flex-1 flex items-center gap-2">
                {item.status === "DONE" && (
                  <span className="text-[10px] text-emerald-400 font-semibold shrink-0 bg-emerald-500/10 rounded px-1.5 py-0.5">
                    Done
                  </span>
                )}
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateTitle(item.localId, e.target.value)}
                  placeholder={`e.g. ${["MIPS Architecture", "Cache Memory", "Pipelining", "Virtual Memory"][idx % 4]}`}
                  maxLength={120}
                  className={cn(
                    "flex-1 rounded-md border border-border/60 bg-background/50 px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/40",
                    "focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/50 transition-all",
                    item.status === "DONE" && "line-through text-muted-foreground"
                  )}
                />
              </div>
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

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({ task, open, onOpenChange }: EditTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [type, setType] = useState<TaskType>("ASSIGNMENT");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [deadline, setDeadline] = useState("");
  const [importance, setImportance] = useState(5);
  const [location, setLocation] = useState("");
  const [weightage, setWeightage] = useState("");
  const [subTaskDrafts, setSubTaskDrafts] = useState<SubTaskDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setCourseCode(task.courseCode);
      setType(task.type);
      setStatus(task.status);
      setDeadline(toDatetimeLocal(task.deadline));
      setImportance(task.importance);
      setLocation(task.location ?? "");
      setWeightage(task.weightage != null ? String(task.weightage) : "");
      // Populate subtask drafts preserving existing IDs and statuses
      setSubTaskDrafts(
        (task.subTasks ?? []).map((s) => ({
          localId: crypto.randomUUID(),
          id: s.id,
          title: s.title,
          status: s.status,
        }))
      );
      setError(null);
    }
  }, [task]);

  const handleClose = (val: boolean) => {
    if (!saving) onOpenChange(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    if (!title.trim() || !courseCode.trim() || !deadline) {
      setError("Please fill in all required fields.");
      return;
    }

    // Build subtask array — preserve existing statuses, assign IDs to new items
    const finalSubTasks: SubTask[] = subTaskDrafts
      .filter((d) => d.title.trim().length > 0)
      .map((d) => ({
        id: d.id || crypto.randomUUID(),
        title: d.title.trim(),
        status: d.status,
      }));

    setSaving(true);
    setError(null);
    try {
      // Firestore rejects undefined values at runtime — use conditional spread
      const updates: Record<string, unknown> = {
        title: title.trim(),
        courseCode: courseCode.trim().toUpperCase(),
        type,
        status,
        deadline: new Date(deadline),
        importance,
        subTasks: finalSubTasks,
      };
      if (location.trim()) updates.location = location.trim();
      if (weightage && !isNaN(Number(weightage))) updates.weightage = Number(weightage);

      await updateDoc<Record<string, unknown>>("tasks", task.id, updates);
      onOpenChange(false);
    } catch (err) {
      console.error("[EditTaskDialog] Failed to save:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
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

  const doneCount = subTaskDrafts.filter((d) => d.status === "DONE" && d.title.trim()).length;
  const totalCount = subTaskDrafts.filter((d) => d.title.trim()).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border/60 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Save className="h-4 w-4 text-primary" />
            Edit Task
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground/80">
            Update task details and manage study topics. Changes save to Firestore immediately.
          </DialogDescription>
        </DialogHeader>

        <form id="edit-task-form" onSubmit={handleSubmit} className="space-y-4 pt-1">
          <Field label="Task Title" required>
            <InputField
              id="edit-task-title"
              value={title}
              onChange={setTitle}
              placeholder="e.g. Midterm Exam — Data Structures"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Course Code" required>
              <InputField
                id="edit-task-course"
                value={courseCode}
                onChange={setCourseCode}
                placeholder="e.g. CSE301"
              />
            </Field>
            <Field label="Task Type" required>
              <Select value={type} onValueChange={(v) => setType(v as TaskType)}>
                <SelectTrigger id="edit-task-type" className="bg-background/60 border-border/70 focus:ring-primary/40">
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
                      <Badge className={cn("text-[10px] px-2 py-0 border", t.color)}>{t.label}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Deadline" required>
              <InputField
                id="edit-task-deadline"
                type="datetime-local"
                value={deadline}
                onChange={setDeadline}
              />
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger id="edit-task-status" className="bg-background/60 border-border/70 focus:ring-primary/40">
                  <SelectValue>
                    <span className={cn("text-sm font-medium", STATUS_OPTIONS.find(s => s.value === status)?.color)}>
                      {STATUS_OPTIONS.find(s => s.value === status)?.label}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="focus:bg-muted/40">
                      <span className={cn("text-sm font-medium", s.color)}>{s.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Importance" hint="Priority score = importance ÷ hours remaining. Higher = shown first.">
            <div className="flex items-center gap-4 pt-1">
              <Slider
                id="edit-task-importance"
                min={1}
                max={10}
                step={1}
                value={[importance]}
                onValueChange={(v) => setImportance(Array.isArray(v) ? (v as number[])[0] : (v as number))}
                className="flex-1"
              />
              <div className="flex items-baseline gap-1.5 min-w-[75px]">
                <span className="text-lg font-bold text-foreground">{importance}</span>
                <span className={cn("text-xs font-semibold", importanceLabelColor)}>{importanceLabel}</span>
              </div>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Location" hint="Optional — exam hall, room, etc.">
              <InputField
                id="edit-task-location"
                value={location}
                onChange={setLocation}
                placeholder="e.g. Hall-3"
              />
            </Field>
            <Field label="Weightage %" hint="Optional — grade weight">
              <InputField
                id="edit-task-weightage"
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
              {totalCount > 0 && (
                <span className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                  doneCount === totalCount
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-primary/70 bg-primary/10"
                )}>
                  {doneCount}/{totalCount} done
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground/70 leading-snug">
              Study topics are preserved when editing — checked items stay checked.
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
            id="edit-task-cancel-btn"
            variant="ghost"
            size="sm"
            onClick={() => handleClose(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            id="edit-task-save-btn"
            type="submit"
            form="edit-task-form"
            size="sm"
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
