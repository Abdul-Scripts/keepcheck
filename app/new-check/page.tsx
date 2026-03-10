"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import CheckForm from "@/components/CheckForm";
import InstallPrompt from "@/components/InstallPrompt";
import OnboardingForm from "@/components/OnboardingForm";
import PageTransition from "@/components/PageTransition";
import { useKeepCheckApp } from "@/hooks/useKeepCheckApp";
import { CheckRecord } from "@/types/check";

export default function NewCheckPage() {
  const router = useRouter();
  const BANNER_SHOW_MS = 2200;
  const BANNER_ANIMATION_MS = 240;
  const {
    isReady,
    isStandalone,
    bootstrapComplete,
    checks,
    setChecks,
    profile,
    setProfile,
  } = useKeepCheckApp();
  const existingRecipients = Array.from(
    new Set(
      checks
        .map((check) => check.recipient.trim())
        .filter((recipient) => recipient.length > 0)
    )
  );
  const suggestedCheckNumber = useMemo(() => {
    const latestNumber = checks.find((check) => /^\d+$/.test(check.checkNumber));
    if (!latestNumber) return "";
    return String(Number(latestNumber.checkNumber) + 1);
  }, [checks]);
  const [isBannerMounted, setIsBannerMounted] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const bannerHideTimerRef = useRef<number | null>(null);
  const bannerUnmountTimerRef = useRef<number | null>(null);
  const bannerRafRef = useRef<number | null>(null);

  function triggerSavedBanner() {
    if (bannerHideTimerRef.current) {
      window.clearTimeout(bannerHideTimerRef.current);
      bannerHideTimerRef.current = null;
    }
    if (bannerUnmountTimerRef.current) {
      window.clearTimeout(bannerUnmountTimerRef.current);
      bannerUnmountTimerRef.current = null;
    }
    if (bannerRafRef.current) {
      window.cancelAnimationFrame(bannerRafRef.current);
      bannerRafRef.current = null;
    }

    setIsBannerMounted(true);
    bannerRafRef.current = window.requestAnimationFrame(() => {
      setIsBannerVisible(true);
      bannerRafRef.current = null;
    });

    bannerHideTimerRef.current = window.setTimeout(() => {
      setIsBannerVisible(false);
      bannerUnmountTimerRef.current = window.setTimeout(() => {
        setIsBannerMounted(false);
        bannerUnmountTimerRef.current = null;
      }, BANNER_ANIMATION_MS);
      bannerHideTimerRef.current = null;
    }, BANNER_SHOW_MS);
  }

  function addCheck(check: CheckRecord) {
    if (checks.some((c) => c.checkNumber === check.checkNumber)) {
      alert("This check number already exists.");
      return;
    }

    setChecks((prev) => [check, ...prev]);
    triggerSavedBanner();
  }

  useEffect(() => {
    return () => {
      if (bannerHideTimerRef.current) {
        window.clearTimeout(bannerHideTimerRef.current);
      }
      if (bannerUnmountTimerRef.current) {
        window.clearTimeout(bannerUnmountTimerRef.current);
      }
      if (bannerRafRef.current) {
        window.cancelAnimationFrame(bannerRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isReady || !isStandalone || !profile) return;
    if (!bootstrapComplete) {
      router.replace("/install/");
    }
  }, [isReady, isStandalone, profile, bootstrapComplete, router]);

  if (!isReady) return null;
  if (!isStandalone) return <InstallPrompt />;
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
  if (!bootstrapComplete) return null;

  return (
    <main style={screenStyle}>
      {isBannerMounted ? (
        <div
          aria-live="polite"
          role="status"
          style={{
            ...savedBannerStyle,
            opacity: isBannerVisible ? 1 : 0,
            transform: isBannerVisible
              ? "translate(-50%, 0)"
              : "translate(-50%, -14px)",
          }}
        >
          Check saved successfully.
        </div>
      ) : null}
      <PageTransition>
        <section style={contentStyle}>
          <h1 style={titleStyle}>Add New Check</h1>
          <p style={subtitleStyle}>Create an outbound check record.</p>
          <CheckForm
            onAddCheck={addCheck}
            existingRecipients={existingRecipients}
            suggestedCheckNumber={suggestedCheckNumber}
          />
        </section>
      </PageTransition>
      <BottomNav />
    </main>
  );
}

const screenStyle: React.CSSProperties = {
  minHeight: "100dvh",
  width: "100%",
};

const contentStyle: React.CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  marginTop: "1rem",
  marginBottom: 0,
  minHeight: "calc(100dvh - 1rem)",
  padding: "1.25rem 1.25rem 12rem 1.25rem",
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  background:
    "radial-gradient(circle at 15% 20%, rgba(251, 191, 36, 0.22), transparent 40%), radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.2), transparent 35%), linear-gradient(155deg, #dbeafe 0%, #c7d2fe 35%, #bfdbfe 65%, #e2e8f0 100%)",
  boxSizing: "border-box",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#0F172A",
  fontSize: "2.2rem",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
};

const subtitleStyle: React.CSSProperties = {
  margin: "0.4rem 0 0.6rem 0",
  color: "#334155",
};

const savedBannerStyle: React.CSSProperties = {
  position: "fixed",
  top: "calc(env(safe-area-inset-top) + 2.15rem)",
  left: "50%",
  transform: "translateX(-50%)",
  width: "min(92vw, 460px)",
  zIndex: 120,
  pointerEvents: "none",
  padding: "0.72rem 0.9rem",
  borderRadius: 12,
  border: "1px solid rgba(52, 211, 153, 0.7)",
  background: "rgba(236, 253, 245, 0.95)",
  color: "#065F46",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.92rem",
  boxShadow: "0 8px 18px rgba(6, 95, 70, 0.12)",
  transition: "opacity 240ms ease, transform 240ms ease",
};
