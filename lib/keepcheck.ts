import { CheckRecord } from "@/types/check";
import { UserProfile } from "@/types/profile";

export const CHECKS_STORAGE_KEY = "keepcheck-records";
export const PROFILE_STORAGE_KEY = "keepcheck-profile";
export const APP_BOOTSTRAP_STORAGE_KEY = "keepcheck-bootstrap-version";
export const APP_BOOTSTRAP_VERSION = "2";
export const APP_LAUNCH_SESSION_KEY = "keepcheck-launch-ready";

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

export function isBootstrapCurrent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(APP_BOOTSTRAP_STORAGE_KEY) === APP_BOOTSTRAP_VERSION;
}

export function markBootstrapComplete(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(APP_BOOTSTRAP_STORAGE_KEY, APP_BOOTSTRAP_VERSION);
}

export function isLaunchReady(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(APP_LAUNCH_SESSION_KEY) === "1";
}

export function markLaunchReady(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(APP_LAUNCH_SESSION_KEY, "1");
}
