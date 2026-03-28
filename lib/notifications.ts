import { loadChecks } from "@/lib/keepcheck";
import { CheckRecord } from "@/types/check";

export const NOTIFICATIONS_ENABLED_STORAGE_KEY = "keepcheck-notifications-enabled";
const REMINDER_LOG_STORAGE_KEY = "keepcheck-reminder-log-v1";
const SCHEDULED_TEST_NOTIFICATIONS_STORAGE_KEY =
  "keepcheck-scheduled-test-notifications-v1";

export type NotificationPermissionState = NotificationPermission | "unsupported";

type ReminderLog = Record<string, string>;
type ScheduledTestNotification = {
  id: string;
  scheduledAt: string;
  createdAt: string;
  sentAt?: string;
};

function isValidDateParts(year: number, month: number, day: number) {
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const probe = new Date(year, month - 1, day);
  return (
    probe.getFullYear() === year &&
    probe.getMonth() === month - 1 &&
    probe.getDate() === day
  );
}

function parseIssueDate(issueDate: string): Date | null {
  const [yearText, monthText, dayText] = issueDate.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!isValidDateParts(year, month, day)) return null;
  return new Date(year, month - 1, day);
}

function parseLocalDateTime(dateValue: string, timeValue: string): Date | null {
  const [yearText, monthText, dayText] = dateValue.split("-");
  const [hourText, minuteText] = timeValue.split(":");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!isValidDateParts(year, month, day)) return null;
  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hour ||
    parsed.getMinutes() !== minute
  ) {
    return null;
  }

  return parsed;
}

function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toLocalIsoDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function getReminderDateKey(issueDate: string): string | null {
  const issue = parseIssueDate(issueDate);
  if (!issue) return null;
  const reminder = new Date(issue);
  reminder.setDate(reminder.getDate() - 1);
  return toLocalIsoDate(reminder);
}

function formatIssueDateForMessage(issueDate: string): string {
  const issue = parseIssueDate(issueDate);
  if (!issue) return issueDate;
  return issue.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAmountForMessage(amount: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getReminderLog(): ReminderLog {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(REMINDER_LOG_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as ReminderLog;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function saveReminderLog(log: ReminderLog) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMINDER_LOG_STORAGE_KEY, JSON.stringify(log));
}

function loadScheduledTestNotifications(): ScheduledTestNotification[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(SCHEDULED_TEST_NOTIFICATIONS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ScheduledTestNotification[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.scheduledAt === "string" &&
        typeof item.createdAt === "string" &&
        (item.sentAt === undefined || typeof item.sentAt === "string")
    );
  } catch {
    return [];
  }
}

function saveScheduledTestNotifications(items: ScheduledTestNotification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    SCHEDULED_TEST_NOTIFICATIONS_STORAGE_KEY,
    JSON.stringify(items)
  );
}

function reminderKey(check: CheckRecord): string {
  return `${check.id}|${check.issueDate}`;
}

function pruneReminderLog(log: ReminderLog, checks: CheckRecord[]): ReminderLog {
  const validKeys = new Set(checks.map((check) => reminderKey(check)));
  const pruned: ReminderLog = {};
  Object.entries(log).forEach(([key, value]) => {
    if (validKeys.has(key)) {
      pruned[key] = value;
    }
  });
  return pruned;
}

export function isNotificationApiSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window;
}

export function getNotificationPermissionStatus(): NotificationPermissionState {
  if (!isNotificationApiSupported()) return "unsupported";
  return Notification.permission;
}

export function loadNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(NOTIFICATIONS_ENABLED_STORAGE_KEY) === "1";
}

export function saveNotificationsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATIONS_ENABLED_STORAGE_KEY, enabled ? "1" : "0");
}

export async function ensureNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationApiSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

export async function showKeepCheckNotification(
  title: string,
  options: NotificationOptions
): Promise<boolean> {
  if (!isNotificationApiSupported()) return false;
  if (Notification.permission !== "granted") return false;

  try {
    if ("serviceWorker" in navigator) {
      const registration =
        (await navigator.serviceWorker.getRegistration("/")) ??
        (await navigator.serviceWorker.ready.catch(() => null));
      if (registration) {
        await registration.showNotification(title, options);
        return true;
      }
    }

    // Fallback for browsers without service worker registration available.
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

export async function sendTestKeepCheckNotification(): Promise<boolean> {
  return showKeepCheckNotification("KeepCheck Test Notification", {
    body: "Notifications are enabled and working.",
    icon: "/apple-touch-icon.png",
    badge: "/web-app-manifest-192x192.png",
    tag: "keepcheck-test",
    renotify: true,
  });
}

export function getDefaultTimedNotificationInput() {
  const future = new Date();
  future.setMinutes(future.getMinutes() + 2);
  future.setSeconds(0, 0);
  return {
    date: toLocalIsoDate(future),
    time: `${String(future.getHours()).padStart(2, "0")}:${String(
      future.getMinutes()
    ).padStart(2, "0")}`,
  };
}

export function scheduleTimedTestNotification(
  dateValue: string,
  timeValue: string
): { ok: true; scheduledAt: string } | { ok: false; error: string } {
  if (typeof window === "undefined") {
    return { ok: false, error: "Unable to schedule notification here." };
  }
  if (!dateValue || !timeValue) {
    return { ok: false, error: "Please choose both date and time." };
  }

  const target = parseLocalDateTime(dateValue, timeValue);
  if (!target) {
    return { ok: false, error: "Invalid date/time value." };
  }

  if (target.getTime() <= Date.now()) {
    return { ok: false, error: "Choose a future date/time." };
  }

  const scheduled = loadScheduledTestNotifications();
  scheduled.push({
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    scheduledAt: target.toISOString(),
    createdAt: new Date().toISOString(),
  });
  saveScheduledTestNotifications(scheduled);
  return { ok: true, scheduledAt: toLocalIsoDateTime(target) };
}

export async function checkScheduledTestNotificationsNow(): Promise<number> {
  if (!isNotificationApiSupported()) return 0;
  if (Notification.permission !== "granted") return 0;

  const items = loadScheduledTestNotifications();
  if (items.length === 0) return 0;

  const now = Date.now();
  let sentCount = 0;
  const updated = items.map((item) => {
    if (item.sentAt) return item;
    const dueAt = new Date(item.scheduledAt).getTime();
    if (!Number.isFinite(dueAt) || dueAt > now) return item;
    return { ...item, sentAt: "PENDING_SEND" };
  });

  for (const item of updated) {
    if (item.sentAt !== "PENDING_SEND") continue;

    const localWhen = new Date(item.scheduledAt).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const sent = await showKeepCheckNotification("KeepCheck Timed Test", {
      body: `Scheduled test fired for ${localWhen}.`,
      icon: "/apple-touch-icon.png",
      badge: "/web-app-manifest-192x192.png",
      tag: `keepcheck-timed-test-${item.id}`,
      renotify: true,
    });

    if (sent) {
      item.sentAt = new Date().toISOString();
      sentCount += 1;
    } else {
      delete item.sentAt;
    }
  }

  const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const pruned = updated.filter((item) => {
    if (!item.sentAt) return true;
    return new Date(item.sentAt).getTime() >= twoDaysAgo;
  });
  saveScheduledTestNotifications(pruned);

  return sentCount;
}

export async function checkPendingCheckRemindersNow(): Promise<number> {
  if (!loadNotificationsEnabled()) return 0;
  if (!isNotificationApiSupported()) return 0;
  if (Notification.permission !== "granted") return 0;

  const checks = loadChecks();
  const today = toLocalIsoDate(new Date());
  const dueChecks = checks.filter((check) => {
    if (check.status !== "pending") return false;
    const reminderDate = getReminderDateKey(check.issueDate);
    return reminderDate === today;
  });

  if (dueChecks.length === 0) return 0;

  const log = pruneReminderLog(getReminderLog(), checks);
  let sentCount = 0;

  for (const check of dueChecks) {
    const key = reminderKey(check);
    if (log[key]) continue;

    const notificationSent = await showKeepCheckNotification(
      "Pending Check Reminder",
      {
        body: `Check #${check.checkNumber} to ${check.recipient} for ${formatAmountForMessage(
          check.amount
        )} is scheduled for ${formatIssueDateForMessage(check.issueDate)}.`,
        icon: "/apple-touch-icon.png",
        badge: "/web-app-manifest-192x192.png",
        tag: `keepcheck-reminder-${check.id}-${check.issueDate}`,
        renotify: false,
      }
    );

    if (notificationSent) {
      log[key] = new Date().toISOString();
      sentCount += 1;
    }
  }

  saveReminderLog(log);
  return sentCount;
}
