"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/explorer", label: "Course Explorer" },
  { href: "/completed", label: "Completed" },
  { href: "/planner", label: "Planner" },
  { href: "/recommendations", label: "Recommendations" },
  { href: "/assistant", label: "AI Assistant" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-3">
        <Link href="/" className="mr-4 text-lg font-bold text-indigo-700">
          CampusFlow
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                pathname === l.href
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
