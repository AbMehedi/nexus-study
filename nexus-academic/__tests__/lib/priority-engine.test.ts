import { describe, expect, it } from "vitest";
import {
  calculatePriority,
  detectCongestedWeek,
  getMostUrgentTask,
} from "@/lib/priority-engine";
import type { Task } from "@/lib/types";

const createTask = (overrides: Partial<Task>): Task => ({
  id: "task-1",
  title: "Essay Draft",
  courseCode: "ENG101",
  deadline: new Date("2026-04-17T12:00:00Z"),
  type: "ASSIGNMENT",
  importance: 5,
  status: "TODO",
  userId: "user-1",
  createdAt: new Date("2026-04-10T00:00:00Z"),
  ...overrides,
});

describe("calculatePriority", () => {
  it("calculates importance over hours remaining", () => {
    const now = new Date("2026-04-17T08:00:00Z");
    const later = createTask({
      importance: 10,
      deadline: new Date("2026-04-17T18:00:00Z"),
    });
    const sooner = createTask({
      importance: 10,
      deadline: new Date("2026-04-17T13:00:00Z"),
    });

    expect(calculatePriority(sooner, now)).toBeCloseTo(2);
    expect(calculatePriority(later, now)).toBeCloseTo(1);
  });
});

describe("detectCongestedWeek", () => {
  it("returns true for three deadlines within seven days", () => {
    const now = new Date("2026-04-17T08:00:00Z");
    const day = 24 * 60 * 60 * 1000;
    const tasks = [
      createTask({ id: "a", deadline: new Date(now.getTime() + day) }),
      createTask({ id: "b", deadline: new Date(now.getTime() + 2 * day) }),
      createTask({ id: "c", deadline: new Date(now.getTime() + 7 * day) }),
    ];

    expect(detectCongestedWeek(tasks, now)).toBe(true);
  });

  it("excludes deadlines just outside the seven day window", () => {
    const now = new Date("2026-04-17T08:00:00Z");
    const day = 24 * 60 * 60 * 1000;
    const tasks = [
      createTask({ id: "a", deadline: new Date(now.getTime() + day) }),
      createTask({ id: "b", deadline: new Date(now.getTime() + 2 * day) }),
      createTask({
        id: "c",
        deadline: new Date(now.getTime() + 7 * day + 60 * 1000),
      }),
    ];

    expect(detectCongestedWeek(tasks, now)).toBe(false);
  });
});

describe("getMostUrgentTask", () => {
  it("returns the task with the highest urgency", () => {
    const now = new Date("2026-04-17T08:00:00Z");
    const tasks = [
      createTask({
        id: "low",
        importance: 6,
        deadline: new Date("2026-04-17T18:00:00Z"),
      }),
      createTask({
        id: "high",
        importance: 8,
        deadline: new Date("2026-04-17T12:00:00Z"),
      }),
    ];

    expect(getMostUrgentTask(tasks, now)?.id).toBe("high");
  });

  it("returns null when no tasks exist", () => {
    const now = new Date("2026-04-17T08:00:00Z");
    expect(getMostUrgentTask([], now)).toBeNull();
  });
});
