import type { TaskWithPriority } from "@/lib/types";

// ─── CSV Export ───────────────────────────────────────────────────────────────

const toDate = (d: unknown): Date => {
  if (d instanceof Date) return d;
  if (d && typeof (d as { toDate?: () => Date }).toDate === "function") {
    return (d as { toDate: () => Date }).toDate();
  }
  return new Date(d as string | number);
};

function escapeCsvField(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Wrap in quotes if it contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTasksToCSV(tasks: TaskWithPriority[]): void {
  const headers = [
    "Title",
    "Course Code",
    "Type",
    "Status",
    "Deadline",
    "Importance",
    "Priority Score",
    "Weightage (%)",
    "Location",
    "Subtasks",
    "Subtask Progress",
  ];

  const rows = tasks.map((task) => {
    const deadline = toDate(task.deadline);
    const deadlineStr = deadline.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const priorityStr =
      task.priority === Number.POSITIVE_INFINITY
        ? "OVERDUE"
        : task.priority < 1
        ? task.priority.toFixed(3)
        : task.priority.toFixed(2);

    const subTasks = task.subTasks ?? [];
    const subTaskTitles = subTasks.map((s) => s.title).join("; ");
    const subTaskDone = subTasks.filter((s) => s.status === "DONE").length;
    const subTaskProgress = subTasks.length > 0 ? `${subTaskDone}/${subTasks.length}` : "";

    return [
      escapeCsvField(task.title),
      escapeCsvField(task.courseCode),
      escapeCsvField(task.type),
      escapeCsvField(task.status),
      escapeCsvField(deadlineStr),
      escapeCsvField(task.importance),
      escapeCsvField(priorityStr),
      escapeCsvField(task.weightage ?? ""),
      escapeCsvField(task.location ?? ""),
      escapeCsvField(subTaskTitles),
      escapeCsvField(subTaskProgress),
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `nexus-tasks-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
