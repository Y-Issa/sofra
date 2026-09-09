import type { Metadata, Viewport } from "next";
import { Newsreader, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const heading = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Sofra — weekly cooking planner",
  description:
    "Plan a week of home cooking around your budget, household size, and nearest market.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5ee" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1913" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", sans.variable, heading.variable)}
      style={{ colorScheme: "light dark" }}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
