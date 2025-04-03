import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Q-Qwen",
  description: "Your chatbot for quantum computing problems",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--background)]`}
      >
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <div className="h-full flex-none">
            <Sidebar />
          </div>
          {/* Main content area */}
          <div className="flex-grow h-full overflow-hidden">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
