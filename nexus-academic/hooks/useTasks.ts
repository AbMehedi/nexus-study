"use client";

import { useEffect, useState } from "react";
import { where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { subscribeToCollection, taskConverter } from "@/lib/firestore-service";
import { calculatePriority } from "@/lib/priority-engine";
import type { Task, TaskWithPriority } from "@/lib/types";

export const useTasks = () => {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<TaskWithPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setTasks([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToCollection<Task>(
      "tasks",
      {
        converter: taskConverter,
        queryConstraints: [where("userId", "==", user.uid)],
      },
      (data) => {
        const withPriority = data.map((task) => ({
          ...task,
          priority: calculatePriority(task),
        }));
        setTasks(withPriority);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, authLoading]);

  return { tasks, loading, error };
};
