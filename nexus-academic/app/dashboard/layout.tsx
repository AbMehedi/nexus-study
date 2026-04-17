"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { SurvivalBanner } from "@/components/dashboard/SurvivalBanner";
import { useSurvivalMode } from "@/hooks/useSurvivalMode";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { isSurvivalMode, congestedTasks, daysUntilClear } = useSurvivalMode();
  const router = useRouter();

  // Auth guard
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading Academic Nexus…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar (handles both desktop fixed + mobile drawer internally) */}
      <Sidebar />

      {/* Main content — offset by sidebar width on desktop */}
      <div className="lg:pl-60 transition-all duration-300" id="dashboard-main-area">
        {/* Mobile top bar spacer */}
        <div className="lg:hidden h-14" aria-hidden="true" />

        <div className="flex flex-col min-h-screen">
          {/* Survival Mode Banner — full width at top of content */}
          {isSurvivalMode && (
            <div className="px-4 pt-4 lg:px-6">
              <SurvivalBanner
                congestedTaskCount={congestedTasks.length}
                daysUntilClear={daysUntilClear}
              />
            </div>
          )}

          {/* Page content */}
          <main
            id="dashboard-content"
            className="flex-1 px-4 py-6 lg:px-6 lg:py-8"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
