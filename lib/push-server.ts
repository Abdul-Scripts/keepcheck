import webpush from "web-push";
import { WebPushSubscription } from "@/lib/push-types";

let isConfigured = false;

function ensureWebPushConfigured() {
  if (isConfigured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:keepcheck@example.com";

  if (!publicKey || !privateKey) {
    throw new Error("Missing VAPID env vars (NEXT_PUBLIC_VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY).");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  isConfigured = true;
}

export type PushSendResult =
  | { ok: true }
  | { ok: false; statusCode?: number; message: string };

export async function sendWebPush(
  subscription: WebPushSubscription,
  payload: unknown
): Promise<PushSendResult> {
  ensureWebPushConfigured();

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { ok: true };
  } catch (error) {
    const pushError = error as { statusCode?: number; message?: string };
    return {
      ok: false,
      statusCode: pushError.statusCode,
      message: pushError.message ?? "Push send failed",
    };
  }
}
