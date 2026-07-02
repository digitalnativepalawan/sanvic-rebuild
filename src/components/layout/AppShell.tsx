import { useRef, useSyncExternalStore, type MouseEvent, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sun,
  Map,
  Route as RouteIcon,
  RadioTower,
  Sparkles,
  Settings,
  LocateFixed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTala } from "@/components/tala/TalaContext";
import { TalaPanel } from "@/components/tala/TalaPanel";
import {
  getLocationState,
  requestLocation,
  subscribeLocation,
} from "@/services/locationService";

const NAV = [
  { to: "/", label: "Today", icon: Sun },
  { to: "/explore", label: "Explorer", icon: Map },
  { to: "/pulse", label: "Pulse", icon: RadioTower },
  { to: "/trip", label: "My Trip", icon: RouteIcon },
];

// Locate: jumps to a map screen (if not already on one) and asks the browser
// for a position fix; the map layer shows the pulsing "you are here" dot.
function useLocate() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const state = useSyncExternalStore(subscribeLocation, getLocationState);

  const locate = () => {
    if (pathname !== "/" && pathname !== "/explore") navigate("/");
    requestLocation();
  };

  return { locate, locating: state.status === "locating" };
}

// Hidden admin access: triple-click/tap the logo within 3 seconds. The first
// two clicks behave like normal home navigation; the third goes to /admin
// (which is still passkey-gated). Direct /admin remains available.
const TRIPLE_TAP_WINDOW_MS = 3000;

function BrandMark() {
  const navigate = useNavigate();
  const taps = useRef<number[]>([]);

  const handleClick = (e: MouseEvent) => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < TRIPLE_TAP_WINDOW_MS), now];
    if (taps.current.length >= 3) {
      taps.current = [];
      e.preventDefault();
      navigate("/admin");
    }
  };

  return (
    <NavLink
      to="/"
      aria-label="SANVIC.PH — home"
      onClick={handleClick}
      className="flex shrink-0 items-center"
    >
      <img
        src="/images/sanvic-wordmark.png"
        alt="SANVIC.PH"
        className="h-9 w-auto md:h-10"
        draggable={false}
      />
    </NavLink>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { openTala } = useTala();
  const { pathname } = useLocation();
  const { locate, locating } = useLocate();
  const isExplore = pathname === "/explore";
  // Map-first screens render the map full-bleed under the chrome.
  const isMapFirst = pathname === "/" || isExplore;

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
          <div className="flex items-center gap-1.5">
            <button
              onClick={locate}
              className={cn(
                "chip border border-white/10 bg-white/5 text-mist-300 hover:border-tide-400/30 hover:text-tide-300",
                locating && "text-tide-300",
              )}
            >
              <LocateFixed size={14} className={cn(locating && "animate-pulse")} />
              Locate
            </button>
            <button
              onClick={() => openTala()}
              className="chip border border-tide-400/30 bg-tide-500/10 text-tide-300 hover:bg-tide-500/20"
            >
              <Sparkles size={14} />
              Ask Tala
            </button>
            <NavLink
              to="/admin"
              aria-label="Admin"
              title="Admin"
              className={({ isActive }) =>
                cn(
                  "rounded-full p-2 transition-colors",
                  isActive
                    ? "bg-tide-500/15 text-tide-300"
                    : "text-mist-500 hover:bg-white/5 hover:text-mist-200",
                )
              }
            >
              <Settings size={15} />
            </NavLink>
          </div>
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

      <main className={cn(!isMapFirst && "mx-auto max-w-6xl px-4 pb-24 pt-4 md:px-6 md:pb-12 md:pt-8")}>
        {children}
      </main>

      {/* Mobile bottom nav */}
      {/* z above the map overlays (sheet z-1000, preview z-1001) so the nav
          always stays tappable under the Today bottom sheet */}
      <nav className="glass fixed inset-x-0 bottom-0 z-[1100] md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid grid-cols-5">
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
          <button
            onClick={locate}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
              locating ? "text-tide-300" : "text-mist-400",
            )}
          >
            <LocateFixed size={19} className={cn(locating && "animate-pulse")} />
            Locate
          </button>
        </div>
      </nav>

      <TalaPanel />
    </div>
  );
}
