import { kv } from "@vercel/kv";
import { PushSubscriberRecord } from "@/lib/push-types";

const KV_KEY = "keepcheck:webpush:subscribers";

let memorySubscribers: PushSubscriberRecord[] = [];

function canUseKv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function loadRawSubscribers(): Promise<PushSubscriberRecord[]> {
  if (!canUseKv()) {
    return memorySubscribers;
  }

  const records = await kv.get<PushSubscriberRecord[]>(KV_KEY);
  return Array.isArray(records) ? records : [];
}

async function saveRawSubscribers(records: PushSubscriberRecord[]) {
  if (!canUseKv()) {
    memorySubscribers = records;
    return;
  }

  await kv.set(KV_KEY, records);
}

export async function listPushSubscribers(): Promise<PushSubscriberRecord[]> {
  return loadRawSubscribers();
}

export async function getPushSubscriber(
  clientId: string
): Promise<PushSubscriberRecord | null> {
  const records = await loadRawSubscribers();
  return records.find((record) => record.clientId === clientId) ?? null;
}

export async function upsertPushSubscriber(record: PushSubscriberRecord) {
  const records = await loadRawSubscribers();
  const next = records.filter((item) => item.clientId !== record.clientId);
  next.push(record);
  await saveRawSubscribers(next);
}

export async function removePushSubscriber(clientId: string) {
  const records = await loadRawSubscribers();
  const next = records.filter((item) => item.clientId !== clientId);
  await saveRawSubscribers(next);
}
