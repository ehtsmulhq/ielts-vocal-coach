"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Card } from "@/ui/primitives";
import { Dialog } from "@/ui/dialog";
import { ProfileForm } from "@/features/profile/ProfileForm";
import { useCaptureStore, useHydrated, useProfile } from "@/features/shared/stores";
import { clearCaptureDraft } from "@/storage/capture";
import { useCaptureSession } from "./useCaptureSession";
import { CaptureSetup } from "./components/CaptureSetup";
import { LiveInterview } from "./components/LiveInterview";

function GradingView() {
  return (
    <Card className="mx-auto max-w-lg space-y-4 py-10 text-center" aria-busy="true">
      <Sparkles className="mx-auto h-8 w-8 animate-pulse text-accent" aria-hidden />
      <h1 className="font-serif text-2xl font-semibold">Preparing your report and scripts</h1>
      <p className="text-muted" role="status">
        Grading your answers against the IELTS criteria and rewriting them into natural spoken English. This usually
        takes 10–30 seconds.
      </p>
    </Card>
  );
}

export function CaptureScreen() {
  const hydrated = useHydrated();
  const profile = useProfile();
  const stored = useCaptureStore();
  const session = useCaptureSession(profile);
  const [editingProfile, setEditingProfile] = useState(false);
  const { status } = session.state;

  if (!hydrated) return <Card className="h-64 animate-pulse bg-surface-2" aria-busy="true" aria-label="Loading" />;

  return (
    <>
      {status === "live" ? (
        <LiveInterview session={session} />
      ) : status === "grading" ? (
        <GradingView />
      ) : (
        <CaptureSetup
          profile={profile}
          stored={stored}
          preparing={status === "preparing"}
          loadingStep={session.state.loadingStep}
          error={session.state.error}
          onStart={(config) => void session.start(config)}
          onEditProfile={() => setEditingProfile(true)}
          onGradeDraft={() => stored.draft && session.gradeDraft(stored.draft)}
          onDiscardDraft={clearCaptureDraft}
        />
      )}

      <Dialog
        open={editingProfile}
        onClose={() => setEditingProfile(false)}
        title="About you"
        description="The examiner uses your name, and your answers become scripts about your own life."
      >
        <ProfileForm profile={profile} onSaved={() => setEditingProfile(false)} />
      </Dialog>
    </>
  );
}
