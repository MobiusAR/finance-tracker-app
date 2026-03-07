import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegistry } from "@/components/layout/PwaRegistry";
import type { Viewport } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Finance Tracker",
  description: "Personal finance tracker for net worth and spending",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Finance Tracker",
  },
  other: {
    "color-scheme": "only light",
    "night-mode": "disable",
    "layoutmode": "standard",
    "imagemode": "force",
    "screen-orientation": "portrait",
  }
};

export const viewport: Viewport = {
  themeColor: "#1B263B",
  colorScheme: "only light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: "only light", backgroundColor: "#F5EBE0" }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
        style={{ colorScheme: "only light", backgroundColor: "#F5EBE0" }}
      >
        <AppShell>{children}</AppShell>
        <Toaster />
        <PwaRegistry />
      </body>
    </html>
  );
}
