"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/ui/primitives";
import { DEFAULT_PROFILE, type CandidateProfile, type TargetBand } from "@/lib/types";
import { saveProfile } from "@/lib/profile";
import { refreshStarterScripts } from "@/lib/master-script";

type Fields = Pick<
  CandidateProfile,
  "preferredName" | "fullName" | "status" | "occupationOrMajor" | "fieldDetails" | "hometownName" | "currentResidence" | "targetBand"
>;

const BLANK: Fields = {
  preferredName: "",
  fullName: "",
  status: "working",
  occupationOrMajor: "",
  fieldDetails: "",
  hometownName: "",
  currentResidence: "",
  targetBand: "7.5",
};

const INPUT = "h-10 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-sm";

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
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-subtle">{hint}</span>}
    </label>
  );
}

/**
 * The learner's profile: used by the examiner (name, band) and as background
 * when rewriting their answers. Starts empty until the learner fills it in,
 * so the built-in example profile is never presented as theirs.
 */
export function ProfileForm({
  profile,
  onSaved,
  submitLabel = "Save profile",
}: {
  profile: CandidateProfile;
  onSaved?: (p: CandidateProfile) => void;
  submitLabel?: string;
}) {
  const [f, setF] = useState<Fields>(() =>
    profile.hasCompletedGrill
      ? {
          preferredName: profile.preferredName,
          fullName: profile.fullName,
          status: profile.status,
          occupationOrMajor: profile.occupationOrMajor,
          fieldDetails: profile.fieldDetails,
          hometownName: profile.hometownName,
          currentResidence: profile.currentResidence,
          targetBand: profile.targetBand,
        }
      : {
          ...BLANK,
          // Keep a name given during onboarding; never pre-fill the example profile.
          preferredName: profile.preferredName !== DEFAULT_PROFILE.preferredName ? profile.preferredName : "",
        }
  );
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setF((prev) => ({ ...prev, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = Object.fromEntries(
      Object.entries(f).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
    ) as Fields;
    const next: CandidateProfile = {
      ...profile,
      ...trimmed,
      fullName: trimmed.fullName || trimmed.preferredName,
      hasCompletedGrill: true,
    };
    saveProfile(next);
    refreshStarterScripts(next);
    onSaved?.(next);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="What should the examiner call you?">
          <input required maxLength={40} value={f.preferredName} onChange={(e) => set("preferredName", e.target.value)} className={INPUT} autoComplete="given-name" />
        </Field>
        <Field label="Full name" hint="Optional">
          <input maxLength={80} value={f.fullName} onChange={(e) => set("fullName", e.target.value)} className={INPUT} autoComplete="name" />
        </Field>
        <Field label="Do you work or study?">
          <select value={f.status} onChange={(e) => set("status", e.target.value as Fields["status"])} className={INPUT}>
            <option value="working">I work</option>
            <option value="studying">I study</option>
            <option value="both">Both</option>
            <option value="transitioning">Between things</option>
          </select>
        </Field>
        <Field label={f.status === "studying" ? "What do you study?" : "What do you do?"}>
          <input maxLength={80} value={f.occupationOrMajor} onChange={(e) => set("occupationOrMajor", e.target.value)} className={INPUT} placeholder="e.g. Nurse, Computer Science" />
        </Field>
      </div>
      <Field label="A little more about it" hint="Optional, one line">
        <input maxLength={160} value={f.fieldDetails} onChange={(e) => set("fieldDetails", e.target.value)} className={INPUT} placeholder="e.g. caring for children in a busy hospital ward" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Hometown">
          <input maxLength={80} value={f.hometownName} onChange={(e) => set("hometownName", e.target.value)} className={INPUT} />
        </Field>
        <Field label="Where you live now">
          <input maxLength={80} value={f.currentResidence} onChange={(e) => set("currentResidence", e.target.value)} className={INPUT} />
        </Field>
      </div>
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Target IELTS band</legend>
        <div className="flex gap-2">
          {(["5.5", "6.5", "7.5"] as TargetBand[]).map((b) => (
            <label
              key={b}
              className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm ${
                f.targetBand === b ? "border-accent bg-accent-soft font-medium text-accent" : "border-line text-muted"
              }`}
            >
              <input type="radio" name="targetBand" className="sr-only" checked={f.targetBand === b} onChange={() => set("targetBand", b)} />
              {b === "7.5" ? "7.5+" : b}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-xs text-subtle">Saved only in this browser.</p>
      <div className="flex justify-end">
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
