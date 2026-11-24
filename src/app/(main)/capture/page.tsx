import type { Metadata } from "next";
import { CaptureScreen } from "@/features/capture/CaptureScreen";

export const metadata: Metadata = { title: "Capture new scripts" };

export default function CapturePage() {
  return <CaptureScreen />;
}
