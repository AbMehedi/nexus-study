import { describe, expect, it } from "vitest";
import { useSurvivalMode } from "@/hooks/useSurvivalMode";
import { detectCongestedWeek } from "@/lib/priority-engine";
import type { Task } from "@/lib/types";

// Re-test the underlying detectCongestedWeek logic that powers useSurvivalMode,
// since the hook itself depends on React context and cannot be unit-tested in isolation.

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

const DAY = 24 * 60 * 60 * 1000;

describe("Survival Mode trigger logic (detectCongestedWeek)", () => {
  it("activates when exactly 3 tasks fall within 7 days", () => {
    const now = new Date("2026-04-17T08:00:00Z");
    const tasks = [
      createTask({ id: "a", deadline: new Date(now.getTime() + 1 * DAY) }),
      createTask({ id: "b", deadline: new Date(now.getTime() + 3 * DAY) }),
      createTask({ id: "c", deadline: new Date(now.getTime() + 5 * DAY) }),
    ];
    expect(detectCongestedWeek(tasks, now)).toBe(true);
  });

  it("does NOT activate with only 2 tasks in 7 days", () => {
    const now = new Date("2026-04-17T08:00:00Z");
    const tasks = [
      createTask({ id: "a", deadline: new Date(now.getTime() + 1 * DAY) }),
      createTask({ id: "b", deadline: new Date(now.getTime() + 3 * DAY) }),
    ];
    expect(detectCongestedWeek(tasks, now)).toBe(false);
  });

  it("excludes DONE tasks from the count", () => {
    const now = new Date("2026-04-17T08:00:00Z");
    const tasks = [
      createTask({ id: "a", deadline: new Date(now.getTime() + 1 * DAY) }),
      createTask({ id: "b", deadline: new Date(now.getTime() + 2 * DAY) }),
      createTask({ id: "c", deadline: new Date(now.getTime() + 3 * DAY), status: "DONE" }),
    ];
    // Only 2 active tasks → not congested
    expect(detectCongestedWeek(tasks, now)).toBe(false);
  });

  it("excludes past deadlines", () => {
    const now = new Date("2026-04-17T08:00:00Z");
    const tasks = [
      createTask({ id: "a", deadline: new Date(now.getTime() - 1 * DAY) }), // past
      createTask({ id: "b", deadline: new Date(now.getTime() + 1 * DAY) }),
      createTask({ id: "c", deadline: new Date(now.getTime() + 2 * DAY) }),
    ];
    // Only 2 future tasks → not congested
    expect(detectCongestedWeek(tasks, now)).toBe(false);
  });

  it("activates with 4+ tasks in 7 days", () => {
    const now = new Date("2026-04-17T08:00:00Z");
    const tasks = [
      createTask({ id: "a", deadline: new Date(now.getTime() + 1 * DAY) }),
      createTask({ id: "b", deadline: new Date(now.getTime() + 2 * DAY) }),
      createTask({ id: "c", deadline: new Date(now.getTime() + 4 * DAY) }),
      createTask({ id: "d", deadline: new Date(now.getTime() + 6 * DAY) }),
    ];
    expect(detectCongestedWeek(tasks, now)).toBe(true);
  });

  it("handles an empty task list gracefully", () => {
    const now = new Date("2026-04-17T08:00:00Z");
    expect(detectCongestedWeek([], now)).toBe(false);
  });
});

// Export to satisfy module check (not strictly needed but consistent)
export {};
