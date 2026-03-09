"use client";

import { useEffect, useMemo, useState } from "react";
import CheckForm from "@/components/CheckForm";
import CheckList from "@/components/CheckList";
import DashboardSummary from "@/components/DashboardSummary";
import InstallPrompt from "@/components/InstallPrompt";
import OnboardingForm from "@/components/OnboardingForm";
import { CheckRecord } from "@/types/check";
import { UserProfile } from "@/types/profile";

const CHECKS_STORAGE_KEY = "keepcheck-records";
const PROFILE_STORAGE_KEY = "keepcheck-profile";

function detectStandaloneMode() {
  if (typeof window === "undefined") return false;

  const nav = window.navigator as Navigator & { standalone?: boolean };
  const displayModeStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches;

  const launchedFromAndroidApp = document.referrer.startsWith("android-app://");
  const launchedFromPwaStartUrl =
    new URLSearchParams(window.location.search).get("source") === "pwa";

  return (
    displayModeStandalone ||
    nav.standalone === true ||
    launchedFromAndroidApp ||
    launchedFromPwaStartUrl
  );
}

export default function Page() {
  const [isReady, setIsReady] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const [checks, setChecks] = useState<CheckRecord[]>(() => {
    if (typeof window === "undefined") return [];

    const saved = localStorage.getItem(CHECKS_STORAGE_KEY);
    if (!saved) return [];

    try {
      return JSON.parse(saved) as CheckRecord[];
    } catch {
      return [];
    }
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window === "undefined") return null;

    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!saved) return null;

    try {
      return JSON.parse(saved) as UserProfile;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const standalone = detectStandaloneMode();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsStandalone(standalone);
    setIsReady(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(CHECKS_STORAGE_KEY, JSON.stringify(checks));
  }, [checks]);

  useEffect(() => {
    if (!profile) return;
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  function addCheck(check: CheckRecord) {
    if (checks.some((c) => c.checkNumber === check.checkNumber)) {
      alert("This check number already exists.");
      return;
    }

    setChecks((prev) => [check, ...prev]);
  }

  function deleteCheck(id: string) {
    setChecks((prev) => prev.filter((check) => check.id !== id));
  }

  const pendingChecks = useMemo(
    () => checks.filter((check) => check.status !== "cleared"),
    [checks]
  );

  const pendingCount = pendingChecks.length;

  const pendingAmount = pendingChecks.reduce((sum, check) => {
    return sum + Number(check.amount || 0);
  }, 0);

  if (!isReady) return null;

  if (!isStandalone) {
    return <InstallPrompt />;
  }

  if (!profile) {
    return <OnboardingForm onComplete={setProfile} />;
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
      <header style={{ marginBottom: "1rem" }}>
        <p style={{ margin: 0, color: "#666" }}>Welcome, {profile.name}</p>
        <h1 style={{ margin: "0.25rem 0 0 0" }}>{profile.businessName}</h1>
      </header>

      <DashboardSummary
        pendingCount={pendingCount}
        pendingAmount={pendingAmount}
      />

      <CheckForm onAddCheck={addCheck} />
      <CheckList checks={checks} onDelete={deleteCheck} />
    </main>
  );
}
