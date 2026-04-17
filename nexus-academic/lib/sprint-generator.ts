import type { FreeBlock, Sprint, Task } from "@/lib/types";

export type SprintMode = "normal" | "survival";

export interface SprintOptions {
  mode?: SprintMode;
}

const minutesBetween = (start: Date, end: Date) =>
  (end.getTime() - start.getTime()) / (1000 * 60);

export const generateSprints = (
  task: Task,
  freeBlocks: FreeBlock[],
  options: SprintOptions = {}
): Sprint[] => {
  const mode = options.mode ?? "normal";
  const sprints: Sprint[] = [];

  freeBlocks.forEach((block, index) => {
    const availableMinutes = minutesBetween(block.start, block.end);
    if (availableMinutes <= 0) {
      return;
    }

    const durationMinutes =
      mode === "survival"
        ? 25
        : availableMinutes >= 90
          ? 90
          : availableMinutes >= 60
            ? 60
            : 0;

    if (durationMinutes <= 0 || availableMinutes < durationMinutes) {
      return;
    }

    sprints.push({
      id: `${task.id}-sprint-${index + 1}`,
      taskId: task.id,
      title: task.title,
      startTime: block.start,
      durationMinutes,
    });
  });

  return sprints;
};
