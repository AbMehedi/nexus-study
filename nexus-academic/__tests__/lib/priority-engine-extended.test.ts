import { describe, expect, it } from "vitest";
import { calculatePriority, sortByUrgency } from "@/lib/priority-engine";
import type { Task } from "@/lib/types";

const createTask = (overrides: Partial<Task>): Task => ({
  id: "task-1",
  title: "Mock Task",
  courseCode: "CSE101",
  deadline: new Date("2026-04-20T12:00:00Z"),
  type: "ASSIGNMENT",
  importance: 5,
  status: "TODO",
  userId: "user-1",
  createdAt: new Date("2026-04-10T00:00:00Z"),
  ...overrides,
});

describe("calculatePriority — edge cases", () => {
  it("returns Infinity for an overdue task", () => {
    const now = new Date("2026-04-20T14:00:00Z"); // 2h after deadline
    const task = createTask({ deadline: new Date("2026-04-20T12:00:00Z") });
    expect(calculatePriority(task, now)).toBe(Number.POSITIVE_INFINITY);
  });

  it("returns Infinity when deadline is exactly now", () => {
    const now = new Date("2026-04-20T12:00:00Z");
    const task = createTask({ deadline: now });
    expect(calculatePriority(task, now)).toBe(Number.POSITIVE_INFINITY);
  });

  it("importance 1 with 1h remaining gives score 1", () => {
    const now = new Date("2026-04-20T11:00:00Z");
    const task = createTask({
      importance: 1,
      deadline: new Date("2026-04-20T12:00:00Z"),
    });
    expect(calculatePriority(task, now)).toBeCloseTo(1);
  });

  it("higher importance → higher priority score (same deadline)", () => {
    const now = new Date("2026-04-20T08:00:00Z");
    const deadline = new Date("2026-04-20T12:00:00Z");
    const low = createTask({ importance: 2, deadline });
    const high = createTask({ importance: 8, deadline });
    expect(calculatePriority(high, now)).toBeGreaterThan(calculatePriority(low, now));
  });

  it("same importance — closer deadline → higher priority", () => {
    const now = new Date("2026-04-20T08:00:00Z");
    const near = createTask({ importance: 5, deadline: new Date("2026-04-20T10:00:00Z") });
    const far = createTask({ importance: 5, deadline: new Date("2026-04-20T20:00:00Z") });
    expect(calculatePriority(near, now)).toBeGreaterThan(calculatePriority(far, now));
  });
});

describe("sortByUrgency", () => {
  it("places higher-priority tasks first", () => {
    const now = new Date("2026-04-20T08:00:00Z");
    const tasks = [
      createTask({ id: "low",  importance: 2, deadline: new Date("2026-04-21T08:00:00Z") }),
      createTask({ id: "high", importance: 9, deadline: new Date("2026-04-20T10:00:00Z") }),
      createTask({ id: "mid",  importance: 5, deadline: new Date("2026-04-20T16:00:00Z") }),
    ];
    const sorted = sortByUrgency(tasks, now);
    expect(sorted[0].id).toBe("high");
    expect(sorted[sorted.length - 1].id).toBe("low");
  });

  it("filters out DONE tasks", () => {
    const now = new Date("2026-04-20T08:00:00Z");
    const tasks = [
      createTask({ id: "done-task", status: "DONE" }),
      createTask({ id: "active", status: "TODO" }),
    ];
    const sorted = sortByUrgency(tasks, now);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].id).toBe("active");
  });

  it("returns an empty array when all tasks are done", () => {
    const now = new Date("2026-04-20T08:00:00Z");
    const tasks = [
      createTask({ id: "a", status: "DONE" }),
      createTask({ id: "b", status: "DONE" }),
    ];
    expect(sortByUrgency(tasks, now)).toHaveLength(0);
  });
});

export {};
