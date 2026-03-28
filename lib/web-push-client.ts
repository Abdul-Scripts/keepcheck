"use client";

import { loadChecks } from "@/lib/keepcheck";
import { loadNotificationsEnabled } from "@/lib/notifications";
import { WebPushSubscription } from "@/lib/push-types";
import { CheckRecord } from "@/types/check";

const PUSH_CLIENT_ID_STORAGE_KEY = "keepcheck-push-client-id";
const PUSH_SYNC_SIGNATURE_STORAGE_KEY = "keepcheck-push-sync-signature";

type PushApiResponse = {
  ok: boolean;
  error?: string;
};

type PushActionResult = {
  ok: boolean;
  error?: string;
};

function generateClientId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getClientId() {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(PUSH_CLIENT_ID_STORAGE_KEY);
  if (existing) return existing;
  const next = generateClientId();
  localStorage.setItem(PUSH_CLIENT_ID_STORAGE_KEY, next);
  return next;
}

function toPendingIssueDates(checks: CheckRecord[]) {
  const validIsoDate = /^\d{4}-\d{2}-\d{2}$/;
  return Array.from(
    new Set(
      checks
        .filter((check) => check.status === "pending")
        .map((check) => check.issueDate)
        .filter((value) => validIsoDate.test(value))
    )
  ).sort();
}

function getTimezone() {
  if (typeof window === "undefined") return "UTC";
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function serializePushSubscription(subscription: PushSubscription): WebPushSubscription {
  const json = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    keys: {
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    },
  };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) return null;

  const existingRoot = await navigator.serviceWorker.getRegistration("/");
  if (existingRoot) return existingRoot;

  const existingCurrent = await navigator.serviceWorker.getRegistration();
  if (existingCurrent) return existingCurrent;

  return navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
}

function computeSyncSignature(
  endpoint: string,
  timezone: string,
  pendingIssueDates: string[]
) {
  return `${endpoint}|${timezone}|${pendingIssueDates.join(",")}`;
}

async function postJson(path: string, payload: unknown): Promise<PushApiResponse> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return {
      ok: false,
      error: "Network unavailable. Try again when online.",
    };
  }

  const parsed = (await response.json().catch(() => null)) as PushApiResponse | null;

  if (!response.ok) {
    return {
      ok: false,
      error: parsed?.error || "Request failed.",
    };
  }

  return parsed ?? { ok: true };
}

export function isWebPushSupported() {
  if (typeof window === "undefined") return false;
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export async function subscribeAndSyncWebPush(
  checks: CheckRecord[],
  options?: { force?: boolean }
): Promise<PushActionResult> {
  try {
    if (!isWebPushSupported()) {
      return { ok: false, error: "Web push is not supported on this device." };
    }

    if (Notification.permission !== "granted") {
      return { ok: false, error: "Notification permission is required." };
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      return {
        ok: false,
        error: "Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY in environment configuration.",
      };
    }

    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      return { ok: false, error: "Service worker registration is unavailable." };
    }

    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      }));

    const clientId = getClientId();
    if (!clientId) {
      return { ok: false, error: "Unable to initialize push client identity." };
    }

    const timezone = getTimezone();
    const pendingIssueDates = toPendingIssueDates(checks);
    const nextSignature = computeSyncSignature(
      subscription.endpoint,
      timezone,
      pendingIssueDates
    );
    const previousSignature = localStorage.getItem(PUSH_SYNC_SIGNATURE_STORAGE_KEY);

    if (!options?.force && nextSignature === previousSignature) {
      return { ok: true };
    }

    const result = await postJson("/api/push/subscribe", {
      clientId,
      timezone,
      pendingIssueDates,
      subscription: serializePushSubscription(subscription),
    });

    if (!result.ok) {
      return { ok: false, error: result.error || "Failed to sync push subscription." };
    }

    localStorage.setItem(PUSH_SYNC_SIGNATURE_STORAGE_KEY, nextSignature);
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Unable to subscribe this device to push notifications.",
    };
  }
}

export async function unsubscribeWebPush(): Promise<PushActionResult> {
  try {
    if (typeof window === "undefined") return { ok: true };

    const clientId = getClientId();
    const registration = await getServiceWorkerRegistration();
    const existingSubscription = await registration?.pushManager.getSubscription();

    if (existingSubscription) {
      await existingSubscription.unsubscribe().catch(() => undefined);
    }

    const result = await postJson("/api/push/unsubscribe", { clientId });
    if (!result.ok) {
      return {
        ok: false,
        error: result.error || "Failed to unsubscribe push notifications.",
      };
    }

    localStorage.removeItem(PUSH_SYNC_SIGNATURE_STORAGE_KEY);
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to disable push notifications." };
  }
}

export async function sendServerTestPush(): Promise<PushActionResult> {
  try {
    if (typeof window === "undefined") {
      return { ok: false, error: "Unavailable in this environment." };
    }

    const clientId = getClientId();
    const result = await postJson("/api/push/test", { clientId });
    if (!result.ok) {
      return {
        ok: false,
        error: result.error || "Unable to send test push notification.",
      };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to send test push notification." };
  }
}

export async function syncWebPushSubscriptionFromLocalChecks(
  options?: { force?: boolean }
) {
  if (typeof window === "undefined") return;
  if (!loadNotificationsEnabled()) return;
  if (!isWebPushSupported()) return;
  if (Notification.permission !== "granted") return;

  const checks = loadChecks();
  await subscribeAndSyncWebPush(checks, { force: options?.force }).catch(() => undefined);
}
