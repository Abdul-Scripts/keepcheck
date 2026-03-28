import { NextRequest, NextResponse } from "next/server";
import { getPushSubscriber, removePushSubscriber } from "@/lib/push-store";
import { sendWebPush } from "@/lib/push-server";

export const runtime = "nodejs";

type TestPushBody = {
  clientId?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as TestPushBody | null;
  const clientId = (body?.clientId ?? "").trim();

  if (!clientId) {
    return NextResponse.json({ ok: false, error: "clientId is required." }, { status: 400 });
  }

  const subscriber = await getPushSubscriber(clientId);
  if (!subscriber) {
    return NextResponse.json(
      { ok: false, error: "No push subscription is registered for this device." },
      { status: 404 }
    );
  }

  let result;
  try {
    result = await sendWebPush(subscriber.subscription, {
      title: "KeepCheck Test",
      body: "Push notifications are working.",
      tag: "keepcheck-test-push",
      url: "/",
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

  if (!result.ok) {
    if (result.statusCode === 404 || result.statusCode === 410) {
      await removePushSubscriber(clientId);
    }

    return NextResponse.json(
      { ok: false, error: result.message || "Failed to send test push." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
