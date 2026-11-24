import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import { THEME_BOOT_SCRIPT } from "@/storage/preferences";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Sounds Like You", template: "%s · Sounds Like You" },
  description:
    "Shadow a British RP model voice phrase by phrase, get accent feedback on every take, and build the accent into muscle memory.",
  applicationName: "Sounds Like You",
  appleWebApp: { capable: true, title: "Sounds Like You", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Draw under the iPhone notch and home bar; layouts pad themselves with env(safe-area-inset-*).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      // The theme script sets data-theme before hydration.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
