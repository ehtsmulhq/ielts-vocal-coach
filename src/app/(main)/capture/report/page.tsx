import type { Metadata } from "next";
import { CaptureReportScreen } from "@/features/capture/CaptureReportScreen";

export const metadata: Metadata = { title: "Interview report" };

export default function CaptureReportPage() {
  return <CaptureReportScreen />;
}
