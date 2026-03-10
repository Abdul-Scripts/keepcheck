"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import InstallPrompt from "@/components/InstallPrompt";
import OnboardingForm from "@/components/OnboardingForm";
import { useKeepCheckApp } from "@/hooks/useKeepCheckApp";

export default function InstallBootstrapPage() {
  const CACHE_NAME = "keepcheck-v5";
  const router = useRouter();
  const {
    isReady,
    isStandalone,
    profile,
    setProfile,
    markBootstrapComplete,
    markLaunchReady,
    bootstrapVersion,
  } = useKeepCheckApp();
  const [statusText, setStatusText] = useState("Preparing offline app…");
  const [hasError, setHasError] = useState(false);
  const [errorText, setErrorText] = useState("");
  const basePath = useMemo(() => {
    const envBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    if (envBasePath) return envBasePath;
    if (typeof window === "undefined") return "";
    const host = window.location.hostname;
    const firstSegment = window.location.pathname.split("/").filter(Boolean)[0];
    if (host.endsWith(".github.io") && firstSegment) {
      return `/${firstSegment}`;
    }
    return "";
  }, []);
  const shellRouteUrls = useMemo(
    () => [
      `${basePath}/`,
      `${basePath}/home/`,
      `${basePath}/install/`,
      `${basePath}/new-check/`,
      `${basePath}/checks/new/`,
      `${basePath}/checks/`,
      `${basePath}/profile/`,
    ],
    [basePath]
  );
  const staticUrls = useMemo(
    () => [
      `${basePath}/manifest.webmanifest`,
      `${basePath}/logo.svg`,
      `${basePath}/logo-kc-simple.svg`,
      `${basePath}/web-app-manifest-192x192.png`,
      `${basePath}/web-app-manifest-512x512.png`,
      `${basePath}/apple-touch-icon.png`,
      `${basePath}/favicon.ico`,
      `${basePath}/cash.png`,
    ],
    [basePath]
  );
  const shellUrls = useMemo(
    () => [...shellRouteUrls, ...staticUrls],
    [shellRouteUrls, staticUrls]
  );

  const extractAssetUrlsFromHtml = useCallback(
    (html: string) => {
      const discovered = new Set<string>();
      const regex = /(src|href)=["']([^"']+)["']/g;
      let match: RegExpExecArray | null = null;
      while ((match = regex.exec(html)) !== null) {
        const raw = match[2];
        if (!raw) continue;
        if (!raw.startsWith("/") && !raw.startsWith(basePath + "/")) continue;
        if (
          raw.includes("/_next/") ||
          raw.endsWith(".js") ||
          raw.endsWith(".css") ||
          raw.endsWith(".json") ||
          raw.endsWith(".ico") ||
          raw.endsWith(".png") ||
          raw.endsWith(".svg") ||
          raw.endsWith(".webmanifest")
        ) {
          discovered.add(raw);
        }
      }
      return Array.from(discovered);
    },
    [basePath]
  );

  const hasCoreOfflineShell = useCallback(
    async (cache: Cache) => {
      const checks = await Promise.all(
        shellRouteUrls.map(async (url) => {
          const exact = await cache.match(url, { ignoreSearch: true });
          if (exact) return exact;
          if (url.endsWith("/") && url !== `${basePath}/`) {
            return cache.match(url.slice(0, -1), { ignoreSearch: true });
          }
          return null;
        })
      );
      return checks.every(Boolean);
    },
    [basePath, shellRouteUrls]
  );

  useEffect(() => {
    if (!isReady || !isStandalone || !profile) return;

    let cancelled = false;

    const run = async () => {
      try {
        setStatusText("Checking service worker…");
        if (!("serviceWorker" in navigator)) {
          throw new Error("Service worker is not supported in this browser.");
        }

        // Reuse existing SW registration when available (important for offline restarts).
        const existingRegistration = await navigator.serviceWorker.getRegistration(
          `${basePath}/`
        );
        if (existingRegistration) {
          await existingRegistration.update().catch(() => {
            // Ignore update failures when offline.
          });
        } else {
          await navigator.serviceWorker.register(`${basePath}/sw.js`, {
            scope: `${basePath}/`,
            updateViaCache: "none",
          });
        }

        // Don't hang forever waiting for `ready` on flaky first-load installs.
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<null>((resolve) => {
            window.setTimeout(() => resolve(null), 5000);
          }),
        ]);
        if (
          registration &&
          !registration.active &&
          !registration.waiting &&
          !registration.installing
        ) {
          throw new Error("Service worker is not active yet. Reload and try again.");
        }

        setStatusText("Verifying offline cache…");
        const cache = await caches.open(CACHE_NAME);

        // Offline-first: if core shell is already cached, proceed immediately.
        const alreadyReady = await hasCoreOfflineShell(cache);
        if (alreadyReady) {
          markBootstrapComplete();
          markLaunchReady();
          if (!cancelled) {
            setStatusText(`Offline cache ready (v${bootstrapVersion}).`);
            window.setTimeout(() => {
              router.replace("/");
            }, 260);
          }
          return;
        }

        setStatusText("Caching app pages for offline use…");
        const routeHtmls = await Promise.all(
          shellRouteUrls.map(async (url) => {
            try {
              const response = await fetch(url, { cache: "reload" });
              if (!response.ok) return null;
              await cache.put(url, response.clone());
              if (url.endsWith("/") && url !== `${basePath}/`) {
                await cache.put(url.slice(0, -1), response.clone());
              }
              return await response.text();
            } catch {
              return null;
            }
          })
        );

        const discoveredAssets = new Set<string>(shellUrls);
        routeHtmls.forEach((html) => {
          if (!html) return;
          extractAssetUrlsFromHtml(html).forEach((url) => discoveredAssets.add(url));
        });

        await Promise.allSettled(
          Array.from(discoveredAssets).map(async (url) => {
            try {
              const response = await fetch(url, { cache: "reload" });
              if (response.ok) {
                await cache.put(url, response.clone());
              }
            } catch {
              // Allow partial failures during online warm-up.
            }
          })
        );

        const isReadyOffline = await hasCoreOfflineShell(cache);
        if (!isReadyOffline) {
          throw new Error("Offline cache is incomplete. Please retry while online.");
        }

        markBootstrapComplete();
        markLaunchReady();
        if (cancelled) return;
        setStatusText(`Offline setup complete (v${bootstrapVersion}).`);
        window.setTimeout(() => {
          router.replace("/");
        }, 380);
      } catch (error) {
        if (cancelled) return;
        setHasError(true);
        setErrorText(
          error instanceof Error
            ? error.message
            : "Setup failed. Please retry while online."
        );
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    isReady,
    isStandalone,
    profile,
    basePath,
    shellUrls,
    shellRouteUrls,
    extractAssetUrlsFromHtml,
    hasCoreOfflineShell,
    router,
    markBootstrapComplete,
    markLaunchReady,
    bootstrapVersion,
  ]);

  if (!isReady) return null;
  if (!isStandalone) return <InstallPrompt />;
  if (!profile) {
    return (
      <OnboardingForm
        onComplete={(nextProfile) => {
          setProfile(nextProfile);
        }}
      />
    );
  }

  return (
    <main style={screenStyle}>
      <section style={cardStyle}>
        <div style={spinnerStyle} aria-hidden="true" />
        <h1 style={titleStyle}>Setting Up KeepCheck</h1>
        <p style={textStyle}>{statusText}</p>
        {hasError ? (
          <>
            <p style={errorStyle}>{errorText}</p>
            <button type="button" onClick={() => window.location.reload()} style={buttonStyle}>
              Retry Setup
            </button>
          </>
        ) : null}
      </section>
    </main>
  );
}

const screenStyle: React.CSSProperties = {
  minHeight: "100dvh",
  width: "100%",
  display: "grid",
  placeItems: "center",
  padding: "1.25rem",
  boxSizing: "border-box",
  background:
    "radial-gradient(circle at 15% 20%, rgba(251, 191, 36, 0.22), transparent 40%), radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.2), transparent 35%), linear-gradient(155deg, #dbeafe 0%, #c7d2fe 35%, #bfdbfe 65%, #e2e8f0 100%)",
};

const cardStyle: React.CSSProperties = {
  width: "min(92vw, 480px)",
  borderRadius: 20,
  border: "1px solid rgba(147, 197, 253, 0.8)",
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 16px 36px rgba(15, 23, 42, 0.14)",
  padding: "1.35rem 1.2rem",
  textAlign: "center",
};

const spinnerStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  margin: "0 auto 0.85rem auto",
  borderRadius: "50%",
  border: "3px solid rgba(147, 197, 253, 0.6)",
  borderTopColor: "#1E3A8A",
  animation: "spin 900ms linear infinite",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#0F172A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "1.45rem",
};

const textStyle: React.CSSProperties = {
  margin: "0.5rem 0 0 0",
  color: "#334155",
  fontSize: "0.98rem",
};

const errorStyle: React.CSSProperties = {
  margin: "0.75rem 0 0 0",
  color: "#B91C1C",
  fontSize: "0.9rem",
};

const buttonStyle: React.CSSProperties = {
  marginTop: "0.9rem",
  border: "none",
  borderRadius: 10,
  padding: "0.62rem 0.9rem",
  color: "#F8FAFC",
  background: "linear-gradient(135deg, #0F172A, #1E3A8A)",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.92rem",
  cursor: "pointer",
};
