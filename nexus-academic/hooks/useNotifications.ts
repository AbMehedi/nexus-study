"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { TaskWithPriority } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationPermission = "default" | "granted" | "denied" | "unsupported";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(d: unknown): Date {
  if (d instanceof Date) return d;
  if (d && typeof (d as { toDate?: () => Date }).toDate === "function") {
    return (d as { toDate: () => Date }).toDate();
  }
  return new Date(d as string | number);
}

function isSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

function hoursUntil(date: Date): number {
  return (date.getTime() - Date.now()) / 3_600_000;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications(tasks: TaskWithPriority[]) {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (!isSupported()) return "unsupported";
    return Notification.permission as NotificationPermission;
  });

  // Track which notifications have already been fired this session
  const firedRef = useRef<Set<string>>(new Set());

  // Request permission from the user
  const requestPermission = useCallback(async () => {
    if (!isSupported()) return;
    const result = await Notification.requestPermission();
    setPermission(result as NotificationPermission);
  }, []);

  // Fire a browser notification
  const notify = useCallback((title: string, body: string, tag: string) => {
    if (!isSupported() || Notification.permission !== "granted") return;
    if (firedRef.current.has(tag)) return;
    firedRef.current.add(tag);
    new Notification(title, {
      body,
      tag,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    });
  }, []);

  // Check tasks every 60 seconds and fire notifications when approaching deadlines
  useEffect(() => {
    if (permission !== "granted") return;

    const check = () => {
      const pending = tasks.filter((t) => t.status !== "DONE");
      pending.forEach((task) => {
        const deadline = toDate(task.deadline);
        const hours = hoursUntil(deadline);

        // 24-hour reminder
        if (hours > 0 && hours <= 24) {
          const tag = `${task.id}-24h`;
          const hoursStr = Math.round(hours);
          notify(
            `⏰ Due in ~${hoursStr}h — ${task.courseCode}`,
            `${task.title} is due in approximately ${hoursStr} hour${hoursStr !== 1 ? "s" : ""}.`,
            tag
          );
        }

        // 1-hour reminder
        if (hours > 0 && hours <= 1) {
          const tag = `${task.id}-1h`;
          const minsStr = Math.round(hours * 60);
          notify(
            `🚨 Due in ~${minsStr} min — ${task.courseCode}`,
            `URGENT: ${task.title} is due very soon!`,
            tag
          );
        }
      });
    };

    check(); // run immediately on mount / task change
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [tasks, permission, notify]);

  return { permission, requestPermission };
}
