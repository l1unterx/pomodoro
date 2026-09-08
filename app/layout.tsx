import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pomodoro",
  description: "A minimalist Pomodoro timer with stats and a leaderboard.",
  appleWebApp: {
    capable: true,
    title: "Pomodoro",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-accent/25 blur-[120px]" />
          <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-accent-break/15 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-accent/10 blur-[120px]" />
        </div>
        <main className="relative flex-1">{children}</main>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
