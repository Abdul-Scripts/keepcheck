import { NextRequest, NextResponse } from "next/server";
import { removePushSubscriber, listPushSubscribers, upsertPushSubscriber } from "@/lib/push-store";
import { sendWebPush } from "@/lib/push-server";
import {
  buildCronNotificationBody,
  getDueIssueDatesForLocalDate,
  getLocalTimePartsInTimeZone,
  shouldRunReminderWindow,
} from "@/lib/push-cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorizedRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const now = new Date();
  const subscribers = await listPushSubscribers();

  let attempted = 0;
  let sent = 0;
  let removed = 0;

  for (const subscriber of subscribers) {
    let localParts;
    try {
      localParts = getLocalTimePartsInTimeZone(now, subscriber.timezone || "UTC");
    } catch {
      localParts = getLocalTimePartsInTimeZone(now, "UTC");
    }

    if (!shouldRunReminderWindow(localParts)) {
      continue;
    }

    if (subscriber.lastDailyPushDate === localParts.dateKey) {
      continue;
    }

    const dueIssueDates = getDueIssueDatesForLocalDate(
      subscriber.pendingIssueDates,
      localParts.dateKey
    );
    if (dueIssueDates.length === 0) {
      continue;
    }

    attempted += 1;

    let pushResult;
    try {
      pushResult = await sendWebPush(subscriber.subscription, {
        title: "Pending Check Reminder",
        body: buildCronNotificationBody(dueIssueDates),
        tag: `keepcheck-daily-${localParts.dateKey}`,
        url: "/",
        dueIssueDates,
      });
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Push service is not configured.",
        },
        { status: 500 }
      );
    }

    if (!pushResult.ok) {
      if (pushResult.statusCode === 404 || pushResult.statusCode === 410) {
        await removePushSubscriber(subscriber.clientId);
        removed += 1;
      }
      continue;
    }

    sent += 1;
    await upsertPushSubscriber({
      ...subscriber,
      updatedAt: now.toISOString(),
      lastDailyPushDate: localParts.dateKey,
    });
  }

  return NextResponse.json({
    ok: true,
    attempted,
    sent,
    removed,
    subscribers: subscribers.length,
    timestamp: now.toISOString(),
  });
}
