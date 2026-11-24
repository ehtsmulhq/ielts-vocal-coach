import { AppShell } from "@/features/shell/AppShell";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
