import type { FirestoreDate, Task } from "@/lib/types";

const toDate = (value: FirestoreDate): Date => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(value as unknown as string | number);
};

const isActiveTask = (task: Task) => task.status !== "DONE";

const getDeadlineDate = (task: Task): Date => toDate(task.deadline);

export const calculatePriority = (task: Task, now: Date = new Date()): number => {
  const deadline = getDeadlineDate(task);
  const hoursRemaining =
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursRemaining <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return task.importance / hoursRemaining;
};

export const detectCongestedWeek = (
  tasks: Task[],
  now: Date = new Date()
): boolean => {
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcoming = tasks.filter((task) => {
    if (!isActiveTask(task)) {
      return false;
    }
    const deadline = getDeadlineDate(task);
    return deadline >= now && deadline <= weekEnd;
  });

  return upcoming.length >= 3;
};

export const sortByUrgency = (tasks: Task[], now: Date = new Date()): Task[] => {
  const scored = tasks
    .filter(isActiveTask)
    .map((task) => ({ task, priority: calculatePriority(task, now) }));

  scored.sort((a, b) => b.priority - a.priority);
  return scored.map((entry) => entry.task);
};

export const getMostUrgentTask = (
  tasks: Task[],
  now: Date = new Date()
): Task | null => {
  const sorted = sortByUrgency(tasks, now);
  return sorted.length ? sorted[0] : null;
};
