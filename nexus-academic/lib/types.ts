import type { Timestamp } from "firebase/firestore";

export type FirestoreTimestamp = Timestamp;
export type FirestoreDate = Date | FirestoreTimestamp;

export interface Task {
  id: string;
  title: string;
  courseCode: string;
  deadline: FirestoreDate;
  type: "EXAM" | "ASSIGNMENT" | "PROJECT" | "PRESENTATION";
  importance: number;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  location?: string;
  weightage?: number;
  subTasks?: SubTask[]; // optional — study topics, checklist items, etc.
  userId: string;
  createdAt: FirestoreDate;
}

export type TaskWithPriority = Task & { priority: number };

export interface CongestedWeekState {
  isSurvivalMode: boolean;
  congestedTasks: TaskWithPriority[];
  daysUntilClear: number;
}

export interface SubTask {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
}

export interface Project {
  id: string;
  title: string;
  courseCode: string;
  deadline: FirestoreDate;
  phase: "REQUIREMENT" | "IMPLEMENTATION" | "DOCUMENTATION" | "SUBMISSION";
  subTasks: SubTask[];
  repoLink?: string;
  docsLink?: string;
  userId: string;
  createdAt: FirestoreDate;
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  freeBlocks: { start: string; end: string }[]; // e.g. [{ start: "09:00", end: "11:00" }]
  userId: string;
}

export interface FreeBlock {
  start: Date;
  end: Date;
}

export interface Sprint {
  id: string;
  taskId: string;
  title: string;
  startTime: Date;
  durationMinutes: number;
}
