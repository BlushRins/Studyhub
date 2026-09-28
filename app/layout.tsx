import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import { getNavTree } from "@/lib/notes";
import "./globals.css";

const sans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Study Hub", template: "%s · Study Hub" },
  description: "Step-by-step study guides for CIS-2101 Data Structures: sets, dictionaries, and priority queues.",
};

export const viewport: Viewport = {
  themeColor: "#0b0d12",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${sans.variable} ${mono.variable}`} id="top">
      <body className="bg-bg font-sans text-fg antialiased">
        <AppShell nav={getNavTree()}>{children}</AppShell>
      </body>
    </html>
  );
}
