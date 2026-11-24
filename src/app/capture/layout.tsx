import type { Metadata } from "next";

export const metadata: Metadata = { title: "Capture new scripts" };

export default function CaptureLayout({ children }: LayoutProps<"/capture">) {
  return children;
}
