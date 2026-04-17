import { describe, expect, it } from "vitest";
import { generateSprints } from "@/lib/sprint-generator";
import type { FreeBlock, Task } from "@/lib/types";

const createTask = (overrides: Partial<Task>): Task => ({
  id: "task-1",
  title: "Midterm Review",
  courseCode: "BIO120",
  deadline: new Date("2026-04-20T12:00:00Z"),
  type: "EXAM",
  importance: 7,
  status: "TODO",
  userId: "user-1",
  createdAt: new Date("2026-04-10T00:00:00Z"),
  ...overrides,
});

describe("generateSprints", () => {
  it("fits sprints within free blocks", () => {
    const start = new Date("2026-04-17T08:00:00Z");
    const freeBlocks: FreeBlock[] = [
      { start, end: new Date(start.getTime() + 2 * 60 * 60 * 1000) },
    ];
    const sprints = generateSprints(createTask({}), freeBlocks);

    expect(sprints).toHaveLength(1);
    const sprint = sprints[0];
    const sprintEnd = new Date(
      sprint.startTime.getTime() + sprint.durationMinutes * 60 * 1000
    );

    expect(sprint.startTime.getTime()).toBeGreaterThanOrEqual(
      freeBlocks[0].start.getTime()
    );
    expect(sprintEnd.getTime()).toBeLessThanOrEqual(
      freeBlocks[0].end.getTime()
    );
    expect(sprint.durationMinutes).toBeGreaterThanOrEqual(60);
    expect(sprint.durationMinutes).toBeLessThanOrEqual(90);
  });

  it("uses shorter sprints in survival mode", () => {
    const start = new Date("2026-04-17T08:00:00Z");
    const freeBlocks: FreeBlock[] = [
      { start, end: new Date(start.getTime() + 2 * 60 * 60 * 1000) },
    ];
    const sprints = generateSprints(createTask({}), freeBlocks, {
      mode: "survival",
    });

    expect(sprints).toHaveLength(1);
    expect(sprints[0].durationMinutes).toBe(25);
  });
});
