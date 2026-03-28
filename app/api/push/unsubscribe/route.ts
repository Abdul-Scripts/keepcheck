import { NextRequest, NextResponse } from "next/server";
import { removePushSubscriber } from "@/lib/push-store";

export const runtime = "nodejs";

type UnsubscribeBody = {
  clientId?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as UnsubscribeBody | null;
  const clientId = (body?.clientId ?? "").trim();

  if (!clientId) {
    return NextResponse.json({ ok: false, error: "clientId is required." }, { status: 400 });
  }

  await removePushSubscriber(clientId);
  return NextResponse.json({ ok: true });
}
