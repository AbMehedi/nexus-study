"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useSurvivalMode } from "@/hooks/useSurvivalMode";
import { useNotifications } from "@/hooks/useNotifications";
import { auth } from "@/lib/firebase";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Settings,
  User,
  Shield,
  Database,
  Zap,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Edit3,
  Bell,
  BellOff,
} from "lucide-react";
import { format } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function InputField({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  id: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    />
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  accent,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  accent?: "primary" | "destructive";
}) {
  return (
    <Card
      className={cn(
        "rounded-xl border-border/60",
        accent === "primary" && "border-primary/20 bg-primary/3",
        accent === "destructive" && "border-destructive/20 bg-destructive/3"
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className={cn(
          "flex items-center gap-2 text-base",
          accent === "destructive" && "text-destructive"
        )}>
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function StatusMessage({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs rounded-lg px-3 py-2 border",
        type === "success"
          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          : "text-destructive bg-destructive/10 border-destructive/20"
      )}
    >
      {type === "success" ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      )}
      {message}
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────

function ProfileSection() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleSaveName = async () => {
    if (!user || !displayName.trim()) return;
    setSaving(true);
    setStatus(null);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      setStatus({ type: "success", msg: "Display name updated successfully." });
      setEditing(false);
    } catch {
      setStatus({ type: "error", msg: "Failed to update name. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const avatarLetter = user?.displayName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <SectionCard title="Profile" icon={User}>
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary text-2xl font-black ring-4 ring-primary/10">
          {avatarLetter}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-foreground">
            {user?.displayName ?? "Unnamed Student"}
          </p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Joined {user?.metadata.creationTime
              ? format(new Date(user.metadata.creationTime), "MMMM yyyy")
              : "—"}
          </p>
        </div>
        <Button
          id="settings-edit-name-btn"
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => setEditing((e) => !e)}
        >
          <Edit3 className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>

      {/* Inline name editor */}
      {editing && (
        <div className="space-y-3 pt-1 border-t border-border/40">
          <Field label="Display Name">
            <InputField
              id="settings-display-name"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Your name"
            />
          </Field>
          <div className="flex gap-2">
            <Button
              id="settings-save-name-btn"
              size="sm"
              onClick={handleSaveName}
              disabled={saving || !displayName.trim()}
              className="gap-2"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Save Name
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setEditing(false); setStatus(null); }}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
          {status && <StatusMessage type={status.type} message={status.msg} />}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Change Password Section ───────────────────────────────────────────────────

function PasswordSection() {
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Only show for email/password accounts
  const isEmailProvider = user?.providerData.some((p) => p.providerId === "password");
  if (!isEmailProvider) {
    return (
      <SectionCard title="Security" icon={Shield}>
        <p className="text-sm text-muted-foreground">
          You signed in with Google. Password management is handled by your Google account.
        </p>
      </SectionCard>
    );
  }

  const handleChangePassword = async () => {
    if (!user?.email) return;
    if (next.length < 6) {
      setStatus({ type: "error", msg: "New password must be at least 6 characters." });
      return;
    }
    if (next !== confirm) {
      setStatus({ type: "error", msg: "New passwords do not match." });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const credential = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, next);
      setStatus({ type: "success", msg: "Password updated successfully." });
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setStatus({ type: "error", msg: "Current password is incorrect." });
      } else {
        setStatus({ type: "error", msg: "Failed to update password. Please try again." });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Security" icon={Shield}>
      <Field label="Current Password">
        <div className="relative">
          <InputField
            id="settings-current-password"
            type={showCurrent ? "text" : "password"}
            value={current}
            onChange={setCurrent}
            placeholder="Enter current password"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showCurrent ? "Hide password" : "Show password"}
          >
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="New Password">
          <div className="relative">
            <InputField
              id="settings-new-password"
              type={showNew ? "text" : "password"}
              value={next}
              onChange={setNext}
              placeholder="Min. 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showNew ? "Hide" : "Show"}
            >
              {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </Field>
        <Field label="Confirm New Password">
          <InputField
            id="settings-confirm-password"
            type="password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Repeat new password"
          />
        </Field>
      </div>
      <Button
        id="settings-change-password-btn"
        size="sm"
        onClick={handleChangePassword}
        disabled={saving || !current || !next || !confirm}
        className="gap-2"
      >
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Update Password
      </Button>
      {status && <StatusMessage type={status.type} message={status.msg} />}
    </SectionCard>
  );
}

// ─── Survival Mode Config ──────────────────────────────────────────────────────

function SurvivalModeInfo() {
  const { isSurvivalMode, congestedTasks, daysUntilClear } = useSurvivalMode();

  return (
    <SectionCard title="Survival Mode" icon={Zap} accent={isSurvivalMode ? "primary" : undefined}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-3 w-3 rounded-full shrink-0",
            isSurvivalMode ? "bg-primary animate-pulse" : "bg-muted-foreground/40"
          )}
        />
        <div>
          <p className="text-sm font-semibold text-foreground">
            {isSurvivalMode ? "Active" : "Inactive"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isSurvivalMode
              ? `${congestedTasks.length} deadlines in the next 7 days · clears in ~${daysUntilClear}d`
              : "No congested week detected."}
          </p>
        </div>
        {isSurvivalMode && (
          <Badge variant="outline" className="ml-auto text-[10px] border-primary/40 text-primary">
            ⚡ ON
          </Badge>
        )}
      </div>

      <div className="space-y-2 text-sm border-t border-border/40 pt-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">How it works</p>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">▸</span>
            Triggers when <strong className="text-foreground">3+ pending tasks</strong> have deadlines within the next 7 days.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">▸</span>
            Switches study sprints to <strong className="text-foreground">25-minute Pomodoro blocks</strong> to reduce cognitive load.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">▸</span>
            Activates <strong className="text-foreground">breathe-glow ring</strong> on the HeroCountdown for critical tasks.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">▸</span>
            Shows the red <strong className="text-foreground">Survival Banner</strong> across all dashboard pages.
          </li>
        </ul>
      </div>
    </SectionCard>
  );
}

// ─── Data Stats ───────────────────────────────────────────────────────────────

function DataStatsSection() {
  const { tasks, loading: tasksLoading } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();

  const pending = tasks.filter((t) => t.status !== "DONE").length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  const activeProjects = projects.filter((p) => p.phase !== "SUBMISSION").length;

  return (
    <SectionCard title="Your Data" icon={Database}>
      {tasksLoading || projectsLoading ? (
        <div className="grid grid-cols-3 gap-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Tasks", value: tasks.length, color: "text-primary" },
            { label: "Pending", value: pending, color: "text-[oklch(0.72_0.18_55)]" },
            { label: "Completed", value: done, color: "text-emerald-400" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border border-border/50 bg-muted/20 p-4 flex flex-col items-center gap-1"
            >
              <span className={cn("text-2xl font-black", color)}>{value}</span>
              <span className="text-[10px] text-muted-foreground text-center">{label}</span>
            </div>
          ))}
        </div>
      )}
      <div className="text-xs text-muted-foreground border-t border-border/40 pt-3">
        <span className="font-medium text-foreground">{activeProjects}</span> active project
        {activeProjects !== 1 ? "s" : ""} · {projects.length} total ·{" "}
        <span className="text-[10px]">synced via Firebase Firestore in real-time</span>
      </div>
    </SectionCard>
  );
}

// ─── Danger Zone ──────────────────────────────────────────────────────────────

function DangerZoneSection() {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await auth.signOut();
  };

  return (
    <SectionCard title="Danger Zone" icon={AlertTriangle} accent="destructive">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium text-foreground">Sign out</p>
          <p className="text-xs text-muted-foreground">
            You will be redirected to the login page.
          </p>
        </div>
        <Button
          id="settings-signout-btn"
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={loggingOut}
          className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/60 shrink-0"
        >
          {loggingOut ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LogOut className="h-3.5 w-3.5" />
          )}
          Sign Out
        </Button>
      </div>
    </SectionCard>
  );
}

// ─── Notifications Section ────────────────────────────────────────────────────

function NotificationsSection() {
  const { tasks } = useTasks();
  const { permission, requestPermission } = useNotifications(tasks);

  const statusLabel: Record<string, string> = {
    granted: "Enabled",
    denied: "Blocked",
    default: "Not yet enabled",
    unsupported: "Not supported in this browser",
  };

  const statusColor: Record<string, string> = {
    granted: "text-emerald-400",
    denied: "text-destructive",
    default: "text-muted-foreground",
    unsupported: "text-muted-foreground",
  };

  return (
    <SectionCard title="Deadline Notifications" icon={Bell}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-3 w-3 rounded-full shrink-0",
            permission === "granted" ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/40"
          )}
        />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {statusLabel[permission] ?? "Unknown"}
          </p>
          <p className={cn("text-xs", statusColor[permission] ?? "text-muted-foreground")}>
            {permission === "granted"
              ? "You'll receive reminders 24h and 1h before deadlines."
              : permission === "denied"
              ? "Notifications are blocked. Enable them in browser settings."
              : permission === "unsupported"
              ? "Your browser doesn't support the Notification API."
              : "Click below to allow deadline reminders."}
          </p>
        </div>
        {permission === "granted" ? (
          <Badge variant="outline" className="ml-auto text-[10px] border-emerald-500/40 text-emerald-400 shrink-0">
            ✓ ON
          </Badge>
        ) : (
          <BellOff className="h-4 w-4 text-muted-foreground/50 shrink-0" />
        )}
      </div>

      {permission !== "granted" && permission !== "unsupported" && (
        <Button
          id="settings-enable-notifications-btn"
          size="sm"
          variant="outline"
          className="gap-2 mt-1"
          onClick={requestPermission}
          disabled={permission === "denied"}
        >
          <Bell className="h-3.5 w-3.5" />
          {permission === "denied" ? "Blocked in Browser" : "Enable Notifications"}
        </Button>
      )}

      <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-3">
        <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">When you'll be notified</p>
        <ul className="space-y-1">
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">▸</span> 24 hours before a task deadline</li>
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">▸</span> 1 hour before a task deadline</li>
          <li className="flex items-start gap-2"><span className="text-muted-foreground/60 mt-0.5">—</span> Notifications are local-only, no server required</li>
        </ul>
      </div>
    </SectionCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your profile, security, and academic dashboard preferences.
        </p>
      </div>

      {/* Sections */}
      <ProfileSection />
      <PasswordSection />
      <NotificationsSection />
      <SurvivalModeInfo />
      <DataStatsSection />
      <DangerZoneSection />

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground pb-4">
        Academic Nexus · All data stored securely in Firebase Firestore
      </p>
    </div>
  );
}
