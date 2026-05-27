"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { TopBar } from "@/components/layout/TopBar";
import { cn } from "@/lib/utils";

/**
 * Three-state responsive layout:
 *
 * Mobile  (< 768px):  Sidebar hidden by default, slides in as a full-height
 *                     drawer over a dark backdrop when hamburger is tapped.
 *
 * Tablet  (768–1023): Sidebar always visible but collapsed to icon-only (w-14).
 *                     Hamburger expands it to full width as an overlay.
 *
 * Desktop (≥ 1024px): Sidebar always visible, full width (w-64).
 *                     Hamburger collapses it to icon-only (w-14).
 */
export function AppShell({
  children,
  orgName,
  period,
  userName,
}: {
  children: React.ReactNode;
  orgName: string;
  period: string;
  userName: string;
}) {
  const pathname = usePathname();

  // Mobile: drawer open/closed
  const [mobileOpen, setMobileOpen] = useState(false);
  // Tablet/Desktop: sidebar collapsed to icons only
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  // Close mobile drawer on navigation — schedule after paint to avoid cascading renders
  useEffect(() => {
    const t = setTimeout(() => setMobileOpen(false), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  // Close mobile drawer on resize to ≥768px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleMenuToggle() {
    // On mobile toggle mobile drawer
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileOpen((v) => !v);
    } else {
      // On tablet/desktop toggle collapsed state
      setDesktopCollapsed((v) => !v);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50/80 text-slate-900">

      {/* ── Desktop/Tablet sidebar (always in DOM, never overlays) ── */}
      <div
        className={cn(
          "hidden md:flex flex-col flex-shrink-0 transition-all duration-200",
          desktopCollapsed ? "w-14" : "w-64",
        )}
        style={{ height: "100dvh", position: "sticky", top: 0 }}
      >
        <SidebarNav collapsed={desktopCollapsed} />
      </div>

      {/* ── Mobile drawer backdrop ── */}
      {mobileOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col md:hidden transition-transform duration-200",
          "w-72 shadow-xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
      </div>

      {/* ── Main content area ── */}
      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <TopBar
          orgName={orgName}
          period={period}
          userName={userName}
          onMenuToggle={handleMenuToggle}
          menuOpen={mobileOpen || !desktopCollapsed}
        />
        <main className="flex-1 p-3 sm:p-4 md:p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
