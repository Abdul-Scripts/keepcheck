import { CheckRecord } from "@/types/check";
import { UserProfile } from "@/types/profile";

export const CHECKS_STORAGE_KEY = "keepcheck-records";
export const PROFILE_STORAGE_KEY = "keepcheck-profile";

export function detectStandaloneMode() {
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

export function loadChecks(): CheckRecord[] {
  if (typeof window === "undefined") return [];

  const saved = localStorage.getItem(CHECKS_STORAGE_KEY);
  if (!saved) return [];

  try {
    return JSON.parse(saved) as CheckRecord[];
  } catch {
    return [];
  }
}

export function loadProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;

  const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!saved) return null;

  try {
    return JSON.parse(saved) as UserProfile;
  } catch {
    return null;
  }
}
