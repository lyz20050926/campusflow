import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { PlannerProvider } from "@/components/PlannerContext";

export const metadata: Metadata = {
  title: "CampusFlow",
  description:
    "A lightweight AI-assisted course planning tool (fictional sample data).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <PlannerProvider>
          <NavBar />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-slate-400">
            CampusFlow is a portfolio project using fictional course data. It is
            not connected to any real university system.
          </footer>
        </PlannerProvider>
      </body>
    </html>
  );
}
