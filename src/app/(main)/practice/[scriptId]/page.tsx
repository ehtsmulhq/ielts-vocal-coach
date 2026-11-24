import type { Metadata } from "next";
import { PracticeScreen } from "@/features/practice/PracticeScreen";

export const metadata: Metadata = { title: "Practice" };

export default async function PracticePage({ params }: PageProps<"/practice/[scriptId]">) {
  const { scriptId } = await params;
  // Scripts live in the learner's browser, so the screen resolves the id client-side.
  return <PracticeScreen scriptId={decodeURIComponent(scriptId)} />;
}
