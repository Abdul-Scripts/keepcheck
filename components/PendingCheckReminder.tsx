"use client";

import { useEffect } from "react";
import {
  checkPendingCheckRemindersNow,
  checkScheduledTestNotificationsNow,
} from "@/lib/notifications";

const REMINDER_POLL_MS = 60 * 1000;

export default function PendingCheckReminder() {
  useEffect(() => {
    const runCheck = () => {
      void checkPendingCheckRemindersNow();
      void checkScheduledTestNotificationsNow();
    };

    runCheck();

    const intervalId = window.setInterval(runCheck, REMINDER_POLL_MS);
    const onFocus = () => runCheck();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        runCheck();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
