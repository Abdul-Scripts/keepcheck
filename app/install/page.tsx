"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import InstallPrompt from "@/components/InstallPrompt";
import OnboardingForm from "@/components/OnboardingForm";
import { useKeepCheckApp } from "@/hooks/useKeepCheckApp";

export default function InstallBootstrapPage() {
  const router = useRouter();
  const {
    isReady,
    isStandalone,
    profile,
    setProfile,
    markBootstrapComplete,
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
  const shellUrls = useMemo(
    () => [
      `${basePath}/`,
      `${basePath}/home/`,
      `${basePath}/checks/`,
      `${basePath}/checks/new/`,
      `${basePath}/profile/`,
      `${basePath}/manifest.webmanifest`,
      `${basePath}/logo.svg`,
      `${basePath}/logo-kc-simple.svg`,
      `${basePath}/web-app-manifest-192x192.png`,
      `${basePath}/web-app-manifest-512x512.png`,
      `${basePath}/cash.png`,
    ],
    [basePath]
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

        // Ensure registration exists for this scope even if previous attempt failed.
        await navigator.serviceWorker.register(`${basePath}/sw.js`, {
          scope: `${basePath}/`,
          updateViaCache: "none",
        });

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

        setStatusText("Caching app pages for offline use…");
        const cache = await caches.open("keepcheck-v2");
        await Promise.all(
          shellUrls.map(async (url) => {
            try {
              const response = await fetch(url, { cache: "reload" });
              if (response.ok) {
                await cache.put(url, response.clone());
              }
            } catch {
              // Ignore single-asset failures; app can still proceed.
            }
          })
        );

        markBootstrapComplete();
        if (cancelled) return;
        setStatusText(`Offline setup complete (v${bootstrapVersion}).`);
        window.setTimeout(() => {
          router.replace("/home/");
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
    router,
    markBootstrapComplete,
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
