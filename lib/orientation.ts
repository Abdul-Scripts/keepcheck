type OrientationLockValue =
  | "any"
  | "natural"
  | "landscape"
  | "portrait"
  | "portrait-primary"
  | "portrait-secondary"
  | "landscape-primary"
  | "landscape-secondary";

type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: OrientationLockValue) => Promise<void>;
  unlock?: () => void;
};

let landscapeAllowanceCount = 0;

function getScreenOrientation(): LockableScreenOrientation | null {
  if (typeof window === "undefined") return null;
  return (window.screen?.orientation as LockableScreenOrientation) ?? null;
}

async function lockPortraitInternal(): Promise<void> {
  const orientation = getScreenOrientation();
  if (!orientation?.lock) return;

  try {
    await orientation.lock("portrait-primary");
    return;
  } catch {
    // Fallback for environments that do not support portrait-primary.
  }

  try {
    await orientation.lock("portrait");
  } catch {
    // Some browsers/platforms block orientation lock; ignore safely.
  }
}

function unlockOrientationInternal(): void {
  const orientation = getScreenOrientation();
  if (!orientation?.unlock) return;

  try {
    orientation.unlock();
  } catch {
    // No-op for unsupported/blocked environments.
  }
}

export function enforcePortraitOrientation(): void {
  if (typeof document === "undefined") return;
  if (landscapeAllowanceCount > 0) return;

  document.body.classList.remove("allow-landscape");
  void lockPortraitInternal();
}

export function allowLandscapeOrientation(): void {
  if (typeof document === "undefined") return;

  landscapeAllowanceCount += 1;
  document.body.classList.add("allow-landscape");
  unlockOrientationInternal();
}

export function releaseLandscapeOrientation(): void {
  if (typeof document === "undefined") return;
  if (landscapeAllowanceCount === 0) return;

  landscapeAllowanceCount -= 1;
  if (landscapeAllowanceCount > 0) return;

  document.body.classList.remove("allow-landscape");
  void lockPortraitInternal();
}
