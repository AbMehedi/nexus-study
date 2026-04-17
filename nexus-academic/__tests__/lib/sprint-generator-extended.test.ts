import { describe, expect, it } from "vitest";
import { generateSprints } from "@/lib/sprint-generator";
import type { FreeBlock, Task } from "@/lib/types";

const MIN = 60 * 1000;

const createTask = (overrides: Partial<Task>): Task => ({
  id: "task-1",
  title: "Deep Work",
  courseCode: "CSE301",
  deadline: new Date("2026-04-22T12:00:00Z"),
  type: "PROJECT",
  importance: 8,
  status: "TODO",
  userId: "user-1",
  createdAt: new Date("2026-04-10T00:00:00Z"),
  ...overrides,
});

const block = (startISO: string, durationMinutes: number): FreeBlock => {
  const start = new Date(startISO);
  const end = new Date(start.getTime() + durationMinutes * MIN);
  return { start, end };
};

describe("generateSprints — normal mode", () => {
  it("generates a 90-min sprint for a 90-min block", () => {
    const sprints = generateSprints(createTask({}), [block("2026-04-17T08:00:00Z", 90)]);
    expect(sprints).toHaveLength(1);
    expect(sprints[0].durationMinutes).toBe(90);
  });

  it("generates a 60-min sprint for a 60–89 min block", () => {
    const sprints = generateSprints(createTask({}), [block("2026-04-17T08:00:00Z", 75)]);
    expect(sprints).toHaveLength(1);
    expect(sprints[0].durationMinutes).toBe(60);
  });

  it("skips a block shorter than 60 minutes", () => {
    const sprints = generateSprints(createTask({}), [block("2026-04-17T08:00:00Z", 45)]);
    expect(sprints).toHaveLength(0);
  });

  it("generates multiple sprints for multiple blocks", () => {
    const sprints = generateSprints(createTask({}), [
      block("2026-04-17T08:00:00Z", 90),
      block("2026-04-17T14:00:00Z", 60),
    ]);
    expect(sprints).toHaveLength(2);
  });

  it("sets sprint start time matching the block start", () => {
    const start = "2026-04-17T09:00:00Z";
    const sprints = generateSprints(createTask({}), [block(start, 90)]);
    expect(sprints[0].startTime.toISOString()).toBe(new Date(start).toISOString());
  });

  it("sets sprint taskId and title from the task", () => {
    const task = createTask({ id: "cse-task", title: "Final Project" });
    const sprints = generateSprints(task, [block("2026-04-17T08:00:00Z", 90)]);
    expect(sprints[0].taskId).toBe("cse-task");
    expect(sprints[0].title).toBe("Final Project");
  });

  it("returns empty array for zero blocks", () => {
    const sprints = generateSprints(createTask({}), []);
    expect(sprints).toHaveLength(0);
  });

  it("skips a zero-length block", () => {
    const now = new Date("2026-04-17T08:00:00Z");
    const sprints = generateSprints(createTask({}), [{ start: now, end: now }]);
    expect(sprints).toHaveLength(0);
  });
});

describe("generateSprints — survival mode", () => {
  it("generates 25-min sprints regardless of block length", () => {
    const sprints = generateSprints(createTask({}), [block("2026-04-17T08:00:00Z", 90)], {
      mode: "survival",
    });
    expect(sprints[0].durationMinutes).toBe(25);
  });

  it("generates a sprint even for a 30-min block in survival mode", () => {
    const sprints = generateSprints(createTask({}), [block("2026-04-17T08:00:00Z", 30)], {
      mode: "survival",
    });
    expect(sprints).toHaveLength(1);
    expect(sprints[0].durationMinutes).toBe(25);
  });

  it("skips a block shorter than 25 min even in survival mode", () => {
    const sprints = generateSprints(createTask({}), [block("2026-04-17T08:00:00Z", 20)], {
      mode: "survival",
    });
    expect(sprints).toHaveLength(0);
  });
});

export {};
