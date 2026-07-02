import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Sun, Map, Route as RouteIcon, RadioTower, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTala } from "@/components/tala/TalaContext";
import { TalaPanel } from "@/components/tala/TalaPanel";

const NAV = [
  { to: "/", label: "Today", icon: Sun },
  { to: "/explore", label: "Explore", icon: Map },
  { to: "/trip", label: "Trip", icon: RouteIcon },
  { to: "/pulse", label: "Pulse", icon: RadioTower },
];

function BrandMark() {
  return (
    <NavLink to="/" className="flex items-center gap-2.5">
      <img src="/images/sanvic-logo.png" alt="" className="h-8 w-8 rounded-lg object-cover" />
      <div className="leading-none">
        <span className="font-display text-lg font-semibold tracking-wide text-mist-100">
          SANVIC
        </span>
        <span className="block text-[10px] uppercase tracking-[0.2em] text-mist-400">
          San Vicente · Palawan
        </span>
      </div>
    </NavLink>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { openTala } = useTala();
  const { pathname } = useLocation();
  const isExplore = pathname === "/explore";

  return (
    <div className="min-h-dvh">
      {/* Desktop / tablet header */}
      <header className="glass sticky top-0 z-40 hidden md:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <BrandMark />
          <nav className="flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-tide-500/15 text-tide-300"
                      : "text-mist-300 hover:bg-white/5 hover:text-mist-100",
                  )
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={() => openTala()}
            className="chip border border-tide-400/30 bg-tide-500/10 text-tide-300 hover:bg-tide-500/20"
          >
            <Sparkles size={14} />
            Ask Tala
          </button>
        </div>
      </header>

      {/* Mobile header (hidden on Explore to give the map the full screen) */}
      {!isExplore && (
        <header className="glass sticky top-0 z-40 md:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <BrandMark />
            <button
              onClick={() => openTala()}
              aria-label="Ask Tala"
              className="chip border border-tide-400/30 bg-tide-500/10 text-tide-300"
            >
              <Sparkles size={14} />
              Tala
            </button>
          </div>
        </header>
      )}

      <main className={cn(!isExplore && "mx-auto max-w-6xl px-4 pb-24 pt-4 md:px-6 md:pb-12 md:pt-8")}>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="glass fixed inset-x-0 bottom-0 z-40 md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid grid-cols-4">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  isActive ? "text-tide-300" : "text-mist-400",
                )
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <TalaPanel />
    </div>
  );
}
