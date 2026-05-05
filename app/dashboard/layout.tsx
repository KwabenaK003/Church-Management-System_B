"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChurchIcon, List, SignOutIcon, X } from "@phosphor-icons/react";

import { supabase } from "@/lib/supabase";
import { bodyFont, displayFont } from "@/lib/fonts";
import { useAuthStore } from "@/lib/stores/authStore";

import { ADMIN_NAVIGATION_GROUPED, type NavGroup } from "@/constants/admin-navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { init } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, [init]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setIsMobileMenuOpen(false);
    router.push("/login");
  }

  function renderNavigation() {
    return ADMIN_NAVIGATION_GROUPED.map((group: NavGroup) => (
      <div key={group.section || "root"} className={group.section ? "mt-4 first:mt-0" : ""}>
        {group.section && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
            {group.section}
          </p>
        )}
        <div className="flex flex-col gap-0.5">
          {group.items.map(({ label, href, icon: Icon }) => {
            const active = href === "/dashboard" ? pathname === href : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                  active
                    ? "bg-[var(--sidebar-active)] text-white"
                    : "text-white/50 hover:bg-[var(--sidebar-hover)] hover:text-white/80",
                ].join(" ")}
              >
                <Icon size={17} weight={active ? "fill" : "regular"} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    ));
  }

  return (
    <div className={`${bodyFont.className} dashboard-shell flex h-screen overflow-hidden bg-[var(--sidebar-bg)]`}>
      <div
        className={[
          "fixed inset-0 z-40 bg-slate-950/50 transition-opacity duration-200 lg:hidden",
          isMobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-[var(--sidebar-bg)] transition-transform duration-200 lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--blue-600)]">
              <ChurchIcon size={18} color="white" weight="fill" />
            </div>
            <span className={`${displayFont.className} dashboard-brand text-sm font-semibold leading-tight text-white`}>
              Bubiashe
              <br />
              <span className="text-xs font-normal text-[var(--text-muted)]">Church Management</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-[var(--sidebar-hover)] hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {renderNavigation()}
        </nav>

        <div className="border-t border-white/8 px-3 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-white/40 transition-all duration-150 hover:bg-[var(--sidebar-hover)] hover:text-white/70"
          >
            <SignOutIcon size={17} />
            Sign out
          </button>
        </div>
      </aside>

      <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col lg:flex">
        <div className="flex items-center gap-3 border-b border-white/8 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--blue-600)]">
            <ChurchIcon size={18} color="white" weight="fill" />
          </div>
          <span className={`${displayFont.className} dashboard-brand text-sm font-semibold leading-tight text-white`}>
            Bubiashe
            <br />
            <span className="text-xs font-normal text-[var(--text-muted)]">Church Management</span>
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {renderNavigation()}
        </nav>

        <div className="border-t border-white/8 px-3 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-white/40 transition-all duration-150 hover:bg-[var(--sidebar-hover)] hover:text-white/70"
          >
            <SignOutIcon size={17} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="m-2 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-xl border border-red-800 bg-[var(--page-bg)]">
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] bg-white text-slate-700 transition-colors hover:bg-slate-50"
            aria-label="Open navigation menu"
          >
            <List size={20} />
          </button>
          <div className="min-w-0">
            <p className={`${displayFont.className} truncate text-sm font-semibold text-slate-900`}>
              Bubiashe
            </p>
            <p className="truncate text-xs text-slate-500">Church Management</p>
          </div>
        </div>
        <div className="flex-1 p-5 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
