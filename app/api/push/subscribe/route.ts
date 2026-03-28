import { NextRequest, NextResponse } from "next/server";
import { getPushSubscriber, upsertPushSubscriber } from "@/lib/push-store";
import { PushSubscriberRecord, WebPushSubscription } from "@/lib/push-types";

export const runtime = "nodejs";

type SubscribeBody = {
  clientId?: string;
  timezone?: string;
  pendingIssueDates?: string[];
  subscription?: WebPushSubscription;
};

function isValidIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizePendingDates(dates: string[] | undefined): string[] {
  if (!Array.isArray(dates)) return [];
  return Array.from(
    new Set(
      dates
        .filter((value): value is string => typeof value === "string")
        .filter(isValidIsoDate)
    )
  ).sort();
}

function isValidSubscription(value: unknown): value is WebPushSubscription {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<WebPushSubscription>;
  return (
    typeof candidate.endpoint === "string" &&
    !!candidate.keys &&
    typeof candidate.keys.p256dh === "string" &&
    typeof candidate.keys.auth === "string"
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SubscribeBody | null;
  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const clientId = (body.clientId ?? "").trim();
  const timezone = (body.timezone ?? "UTC").trim() || "UTC";
  const pendingIssueDates = normalizePendingDates(body.pendingIssueDates);

  if (!clientId) {
    return NextResponse.json({ ok: false, error: "clientId is required." }, { status: 400 });
  }
  if (!isValidSubscription(body.subscription)) {
    return NextResponse.json(
      { ok: false, error: "Valid push subscription is required." },
      { status: 400 }
    );
  }

  const existing = await getPushSubscriber(clientId);
  const now = new Date().toISOString();
  const record: PushSubscriberRecord = {
    clientId,
    timezone,
    pendingIssueDates,
    subscription: body.subscription,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastDailyPushDate: existing?.lastDailyPushDate,
  };

  await upsertPushSubscriber(record);

  return NextResponse.json({ ok: true });
}
