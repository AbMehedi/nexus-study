"use client";

import { useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import type { FirestoreDate } from "@/lib/types";

const toDate = (value: FirestoreDate): Date => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(value as unknown as string | number);
};

const getDaysUntil = (from: Date, to: Date) =>
  Math.max(0, Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)));

export const useSurvivalMode = () => {
  const { tasks } = useTasks();

  return useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const congestedTasks = tasks.filter((task) => {
      if (task.status === "DONE") {
        return false;
      }
      const deadline = toDate(task.deadline);
      return deadline >= now && deadline <= weekEnd;
    });

    const isSurvivalMode = congestedTasks.length >= 3;
    let daysUntilClear = 0;

    if (congestedTasks.length) {
      const latestDeadline = congestedTasks.reduce<Date>((latest, task) => {
        const deadline = toDate(task.deadline);
        return deadline > latest ? deadline : latest;
      }, toDate(congestedTasks[0].deadline));

      daysUntilClear = getDaysUntil(now, latestDeadline);
    }

    return {
      isSurvivalMode,
      congestedTasks,
      daysUntilClear,
    };
  }, [tasks]);
};
