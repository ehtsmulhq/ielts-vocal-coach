"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, Upload } from "lucide-react";
import { Alert, Button, Card, cn } from "@/ui/primitives";
import { useHydrated, usePreferences, useProfile } from "@/features/shared/stores";
import { ProfileForm } from "@/features/profile/ProfileForm";
import { useModelPlayer } from "@/features/practice/useModelPlayer";
import { CoachPicker, coachIntro } from "@/features/tutor/CoachPicker";
import { updatePreferences, type ThemePreference } from "@/storage/preferences";
import { exportUserData, importUserData } from "@/storage/backup";
import { wipeAllUserData } from "@/storage/wipe";

const RATES = [0.75, 0.85, 1] as const;
const THEMES: { id: ThemePreference; label: string }[] = [
  { id: "system", label: "Match my device" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

function Choice<T extends string | number>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label
          key={String(o.id)}
          className={cn(
            "cursor-pointer rounded-full border px-4 py-1.5 text-sm",
            value === o.id ? "border-accent bg-accent-soft font-medium text-accent" : "border-line text-muted"
          )}
        >
          <input type="radio" name={name} className="sr-only" checked={value === o.id} onChange={() => onChange(o.id)} />
          {o.label}
        </label>
      ))}
    </div>
  );
}

function DataSection() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const download = () => {
    const blob = new Blob([exportUserData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accent-gym-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ tone: "success", text: "Backup downloaded. Keep the file somewhere safe." });
  };

  const restore = async (file: File) => {
    const result = importUserData(await file.text());
    setMessage(
      result.ok
        ? { tone: "success", text: "Backup restored. Your scripts, scores and settings are back." }
        : { tone: "danger", text: result.error }
    );
  };

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Your data</h2>
        <p className="text-sm text-muted">
          Everything is stored only in this browser. Download a backup to move it to another device or keep it safe;
          cached model audio isn&apos;t included and is simply recreated.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={download}>
          <Download className="h-4 w-4" aria-hidden /> Download backup
        </Button>
        <Button onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4" aria-hidden /> Restore from backup
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Backup file to restore"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void restore(file);
            e.target.value = "";
          }}
        />
      </div>
      <div aria-live="polite">{message && <Alert tone={message.tone}>{message.text}</Alert>}</div>
      <div className="border-t border-line pt-4">
        {confirming ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-danger">
              This permanently deletes your profile, scripts, scores and settings from this browser.
            </span>
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                await wipeAllUserData();
                router.push("/");
              }}
            >
              Yes, erase everything
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" className="text-danger" onClick={() => setConfirming(true)}>
            <Trash2 className="h-4 w-4" aria-hidden /> Erase all my data
          </Button>
        )}
      </div>
    </Card>
  );
}

export function SettingsScreen() {
  const hydrated = useHydrated();
  const profile = useProfile();
  const prefs = usePreferences();
  const player = useModelPlayer();
  const [profileSaved, setProfileSaved] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  if (!hydrated) return <Card className="h-64 animate-pulse bg-surface-2" aria-busy="true" aria-label="Loading" />;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl font-semibold">Settings</h1>
      </header>

      <Card className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Your coach</h2>
          <p className="text-sm text-muted">
            Your coach teaches you in lessons and reads every script you shadow, all in a British (Received
            Pronunciation) accent.
          </p>
        </div>
        <CoachPicker
          value={prefs.tutorId}
          onChange={(tutorId) => updatePreferences({ tutorId })}
          previewingId={preview}
          onPreview={(t) => {
            if (preview === t.id) {
              player.stop();
              setPreview(null);
              return;
            }
            updatePreferences({ tutorId: t.id });
            setPreview(t.id);
            void player.playModel(coachIntro(t), 1).finally(() => setPreview((p) => (p === t.id ? null : p)));
          }}
        />
        <div className="space-y-2">
          <span className="text-sm font-medium">Default speed</span>
          <Choice
            name="Default speed"
            value={prefs.modelRate}
            options={RATES.map((r) => ({ id: r, label: `${r}x` }))}
            onChange={(r) => updatePreferences({ modelRate: r })}
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">About you</h2>
          <p className="text-sm text-muted">Used by the examiner and as background when your answers become scripts.</p>
        </div>
        {profileSaved && <Alert tone="success">Profile saved.</Alert>}
        {/* Keyed so the form re-reads the profile after a restore or a save elsewhere. */}
        <ProfileForm key={profile.lastUpdated ?? 0} profile={profile} onSaved={() => setProfileSaved(true)} />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <Choice name="Theme" value={prefs.theme} options={THEMES} onChange={(theme) => updatePreferences({ theme })} />
      </Card>

      <DataSection />
    </div>
  );
}
