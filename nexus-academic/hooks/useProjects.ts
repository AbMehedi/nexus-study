"use client";

import { useEffect, useState } from "react";
import { where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { projectConverter, subscribeToCollection } from "@/lib/firestore-service";
import type { Project } from "@/lib/types";

export const useProjects = () => {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setProjects([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToCollection<Project>(
      "projects",
      {
        converter: projectConverter,
        queryConstraints: [where("userId", "==", user.uid)],
      },
      (data) => {
        setProjects(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, authLoading]);

  return { projects, loading, error };
};
