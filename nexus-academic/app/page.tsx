"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // or a redirect component
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">Academic Nexus</h1>
        <Button onClick={() => auth.signOut()}>Logout</Button>
      </header>
      <main className="flex-1 p-6">
        <h2 className="text-xl mb-4">Welcome, {user.email}</h2>
        {/* Dashboard components will go here */}
      </main>
    </div>
  );
}
