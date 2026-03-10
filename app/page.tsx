"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import DashboardSummary from "@/components/DashboardSummary";
import InstallPrompt from "@/components/InstallPrompt";
import MonitorChecks from "@/components/MonitorChecks";
import OnboardingForm from "@/components/OnboardingForm";
import PageTransition from "@/components/PageTransition";
import { useKeepCheckApp } from "@/hooks/useKeepCheckApp";

const INTRO_HEADER_HEIGHT = 88;
const INTRO_HIDE_SCROLL_THRESHOLD = 28;
const INTRO_SHOW_SCROLL_THRESHOLD = 10;

export default function Page() {
  const router = useRouter();
  const {
    isReady,
    isStandalone,
    bootstrapComplete,
    launchNeedsBootstrap,
    checks,
    setChecks,
    profile,
    setProfile,
  } = useKeepCheckApp();
  const [isIntroHidden, setIsIntroHidden] = useState(false);
  const introScrollMarkerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isReady || !isStandalone || !profile) return;

    let rafId: number | null = null;

    const updateIntroVisibility = () => {
      rafId = null;
      const marker = introScrollMarkerRef.current;
      if (!marker) return;

      const markerTop = marker.getBoundingClientRect().top;
      const scrolledDistance = Math.max(0, -markerTop);
      setIsIntroHidden((prev) => {
        if (!prev && scrolledDistance >= INTRO_HIDE_SCROLL_THRESHOLD) return true;
        if (prev && scrolledDistance <= INTRO_SHOW_SCROLL_THRESHOLD) return false;
        return prev;
      });
    };

    const scheduleUpdate = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(updateIntroVisibility);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    document.addEventListener("scroll", scheduleUpdate, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("orientationchange", scheduleUpdate);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", scheduleUpdate);
      document.removeEventListener("scroll", scheduleUpdate, true);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);
    };
  }, [isReady, isStandalone, profile]);

  function markCheckCleared(id: string) {
    setChecks((prev) =>
      prev.map((check) =>
        check.id === id ? { ...check, status: "cleared" } : check
      )
    );
  }

  const pendingChecks = useMemo(
    () => checks.filter((check) => check.status !== "cleared"),
    [checks]
  );
  const clearedChecks = useMemo(
    () => checks.filter((check) => check.status === "cleared"),
    [checks]
  );

  const pendingCount = pendingChecks.length;
  const clearedCount = clearedChecks.length;

  const pendingAmount = pendingChecks.reduce((sum, check) => {
    return sum + Number(check.amount || 0);
  }, 0);
  const currentMonthLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    []
  );

  useEffect(() => {
    if (!isReady || !isStandalone || !profile) return;
    if (!bootstrapComplete || launchNeedsBootstrap) {
      router.replace("/install/");
    }
  }, [isReady, isStandalone, profile, bootstrapComplete, launchNeedsBootstrap, router]);

  if (!isReady) return null;

  if (!isStandalone) {
    return <InstallPrompt />;
  }

  if (!profile) {
    return (
      <OnboardingForm
        onComplete={(nextProfile) => {
          setProfile(nextProfile);
          router.replace("/install/");
        }}
      />
    );
  }

  if (!bootstrapComplete || launchNeedsBootstrap) return null;

  return (
    <main style={screenStyle}>
      <PageTransition>
        <header style={introFixedStyle}>
          <div
            style={{
              ...introInnerStyle,
              opacity: 1,
              pointerEvents: "auto",
            }}
          >
            <p
              className="keepcheck-welcome-line"
              style={{
                ...welcomeLineStyle,
                opacity: isIntroHidden ? 0 : 0.98,
                transform: isIntroHidden
                  ? "translateY(-20px) scale(0.93)"
                  : "translateY(12px) scale(1)",
              }}
            >
              Welcome, <span style={nameAccentStyle}>{profile.name}</span>
            </p>
          </div>
        </header>
        <div ref={introScrollMarkerRef} style={introSpacerStyle} />

        <div style={contentStyle}>
          <h1 style={businessNameStyle}>{profile.businessName}</h1>
          <p style={monthLabelStyle}>{currentMonthLabel}</p>
          <DashboardSummary
            pendingCount={pendingCount}
            clearedCount={clearedCount}
            pendingAmount={pendingAmount}
          />
          <MonitorChecks checks={checks} onMarkCleared={markCheckCleared} />
        </div>
      </PageTransition>
      <BottomNav />
    </main>
  );
}

const screenStyle: React.CSSProperties = {
  minHeight: "100dvh",
  width: "100%",
  boxSizing: "border-box",
  background: "transparent",
};

const introFixedStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 40,
  width: "100%",
  background: "transparent",
};

const introInnerStyle: React.CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  padding: "1.35rem 1.25rem 0 1.25rem",
  boxSizing: "border-box",
  transition: "opacity 170ms cubic-bezier(0.22, 1, 0.36, 1)",
  willChange: "opacity",
};

const introSpacerStyle: React.CSSProperties = {
  height: INTRO_HEADER_HEIGHT,
};

const welcomeLineStyle: React.CSSProperties = {
  margin: 0,
  color: "#CBD5E1",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "2.05rem",
  letterSpacing: "0.5px",
  transition:
    "opacity 210ms cubic-bezier(0.22, 1, 0.36, 1), transform 240ms cubic-bezier(0.16, 1, 0.3, 1)",
  willChange: "opacity, transform",
};

const nameAccentStyle: React.CSSProperties = {
  color: "#F8FAFC",
  letterSpacing: "0.6px",
};

const businessNameStyle: React.CSSProperties = {
  margin: "0.1rem 0 0.9rem 0",
  color: "#0F172A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "2.9rem",
  letterSpacing: "0.8px",
  lineHeight: 1.12,
};

const monthLabelStyle: React.CSSProperties = {
  margin: "-0.45rem 0 0.95rem 0",
  color: "#1E3A8A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "1.02rem",
  letterSpacing: "0.32px",
};

const contentStyle: React.CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  marginTop: "0.95rem",
  marginBottom: 0,
  padding: "1.2rem 1.25rem 12rem 1.25rem",
  boxSizing: "border-box",
  background:
    "radial-gradient(circle at 15% 20%, rgba(251, 191, 36, 0.22), transparent 40%), radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.2), transparent 35%), linear-gradient(155deg, #dbeafe 0%, #c7d2fe 35%, #bfdbfe 65%, #e2e8f0 100%)",
  borderRadius: 24,
};
