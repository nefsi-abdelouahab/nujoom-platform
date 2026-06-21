"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export interface SidebarLink {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export default function Sidebar({
  title,
  links,
}: {
  title: string;
  links: SidebarLink[];
}) {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();

  return (
    <aside className="w-64 shrink-0 border-l border-amber-500/10 bg-neutral-950/80 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-amber-500/10">
        <h2 className="text-lg font-extrabold text-amber-400">نجوم القراءة</h2>
        <p className="text-xs text-neutral-500 mt-0.5">{title}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-4 py-2.5 text-sm transition ${
                active
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "text-neutral-300 hover:bg-neutral-800/60 hover:text-neutral-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-amber-500/10 px-5 py-4">
        <p className="text-sm text-neutral-200 truncate">
          {currentUser?.fullName}
        </p>
        <button
          onClick={logout}
          className="mt-2 w-full rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-red-500/40 hover:text-red-400"
        >
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}