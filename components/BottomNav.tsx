"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/new-check", label: "New Check", icon: PlusCheckIcon },
  { href: "/checks", label: "All Checks", icon: ListIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

function withTrailingSlash(path: string) {
  return path === "/" ? "/" : `${path}/`;
}

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const normalizedPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  const matchedNonHomeHref =
    NAV_ITEMS.filter((item) => item.href !== "/").find(
      (item) =>
        normalizedPath === item.href || normalizedPath.startsWith(item.href + "/")
    )?.href ?? null;

  const prefetchRoute = (href: string) => {
    if (typeof window === "undefined") return;
    if (!navigator.onLine) return;
    const key = `keepcheck-prefetched:${href}`;
    if (sessionStorage.getItem(key) === "1") return;
    router.prefetch(withTrailingSlash(href));
    sessionStorage.setItem(key, "1");
  };

  return (
    <nav style={navStyle} aria-label="Primary" data-bottom-nav>
      <div style={baseFillStyle} />
      <div style={innerStyle}>
        {NAV_ITEMS.map((item) => {
          const isHome = item.href === "/";
          const isActive = isHome
            ? matchedNonHomeHref === null
            : matchedNonHomeHref === item.href;

          return (
            <Link
              key={item.href}
              href={withTrailingSlash(item.href)}
              prefetch={false}
              onMouseEnter={() => prefetchRoute(item.href)}
              onTouchStart={() => prefetchRoute(item.href)}
              style={{
                ...linkStyle,
                ...(isActive ? activeLinkStyle : null),
              }}
            >
              <span
                style={{
                  ...iconWrapStyle,
                  ...(isActive ? activeIconWrapStyle : null),
                }}
              >
                <item.icon />
              </span>
              <span
                style={{
                  ...labelStyle,
                  ...(isActive ? activeLabelStyle : null),
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const navStyle: React.CSSProperties = {
  position: "fixed",
  left: -2,
  right: -2,
  bottom: 0,
  zIndex: 60,
  overflow: "visible",
  padding: "0.35rem 0 calc(env(safe-area-inset-bottom) + 0.7rem) 0",
  background:
    "linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.24) 28%, rgba(15,23,42,0.5) 100%)",
};

const baseFillStyle: React.CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: "-2px",
  height: "calc(env(safe-area-inset-bottom) + 1.1rem)",
  background: "rgba(15, 23, 42, 0.96)",
  borderLeft: "1px solid rgba(147, 197, 253, 0.45)",
  borderRight: "1px solid rgba(147, 197, 253, 0.45)",
  zIndex: 0,
};

const innerStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexWrap: "nowrap",
  gap: "0.35rem",
  borderTopLeftRadius: 22,
  borderTopRightRadius: 22,
  padding: "0.85rem 0.75rem 0.9rem 0.75rem",
  background: "rgba(15, 23, 42, 0.96)",
  border: "1px solid rgba(147, 197, 253, 0.45)",
  borderBottom: "none",
};

const linkStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.2rem",
  width: "min(19.5vw, 92px)",
  textAlign: "center",
  textDecoration: "none",
  borderRadius: 13,
  padding: "0.58rem 0.42rem",
  color: "#BFDBFE",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.78rem",
  letterSpacing: "0.2px",
  lineHeight: 1.1,
  whiteSpace: "nowrap",
  transition:
    "color 360ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 360ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 360ms cubic-bezier(0.2, 0.8, 0.2, 1)",
  transform: "translateY(0)",
  opacity: 0.96,
};

const activeLinkStyle: React.CSSProperties = {
  color: "#F8FAFC",
  transform: "translateY(-3px)",
  opacity: 1,
};

const iconWrapStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition:
    "transform 380ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 380ms cubic-bezier(0.2, 0.8, 0.2, 1)",
  transform: "scale(1)",
  opacity: 0.95,
};

const activeIconWrapStyle: React.CSSProperties = {
  transform: "scale(1.12)",
  opacity: 1,
};

const labelStyle: React.CSSProperties = {
  borderBottom: "2px solid transparent",
  paddingBottom: "0.1rem",
  transition:
    "border-color 360ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 360ms cubic-bezier(0.2, 0.8, 0.2, 1)",
};

const activeLabelStyle: React.CSSProperties = {
  borderBottomColor: "#93C5FD",
};

function iconCommonProps(): React.SVGProps<SVGSVGElement> {
  return {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
}

function HomeIcon() {
  return (
    <svg {...iconCommonProps()}>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
    </svg>
  );
}

function PlusCheckIcon() {
  return (
    <svg {...iconCommonProps()}>
      <path d="M12 4v16" />
      <path d="M4 12h16" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg {...iconCommonProps()}>
      <path d="M8 6h12" />
      <path d="M8 12h12" />
      <path d="M8 18h12" />
      <circle cx="4.5" cy="6" r="1" />
      <circle cx="4.5" cy="12" r="1" />
      <circle cx="4.5" cy="18" r="1" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg {...iconCommonProps()}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1.4-3 4-4.5 7-4.5S17.6 17 19 20" />
    </svg>
  );
}
