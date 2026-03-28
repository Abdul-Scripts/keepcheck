type LocalTimeParts = {
  dateKey: string;
  hour: number;
  minute: number;
};

function isValidIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function dateKeyFromUtcDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getReminderDateKey(issueDate: string): string | null {
  if (!isValidIsoDate(issueDate)) return null;
  const [yearText, monthText, dayText] = issueDate.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() - 1);
  return dateKeyFromUtcDate(utcDate);
}

export function getLocalTimePartsInTimeZone(date: Date, timeZone: string): LocalTimeParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const year = map.year ?? "0000";
  const month = map.month ?? "01";
  const day = map.day ?? "01";
  const hour = Number(map.hour ?? "0");
  const minute = Number(map.minute ?? "0");

  return {
    dateKey: `${year}-${month}-${day}`,
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

export function getDueIssueDatesForLocalDate(
  pendingIssueDates: string[],
  localDateKey: string
) {
  return pendingIssueDates.filter((issueDate) => getReminderDateKey(issueDate) === localDateKey);
}

export function shouldRunReminderWindow(parts: LocalTimeParts) {
  return parts.hour >= 0 && parts.hour < 2;
}

export function buildCronNotificationBody(dueIssueDates: string[]) {
  if (dueIssueDates.length <= 1) {
    return "You have 1 pending check scheduled for tomorrow.";
  }

  return `You have ${dueIssueDates.length} pending checks scheduled for tomorrow.`;
}
