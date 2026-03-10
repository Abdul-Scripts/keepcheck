"use client";

import { useEffect } from "react";
import { enforcePortraitOrientation } from "@/lib/orientation";

export default function OrientationController() {
  useEffect(() => {
    enforcePortraitOrientation();

    const recheck = () => {
      enforcePortraitOrientation();
    };

    window.addEventListener("focus", recheck);
    window.addEventListener("orientationchange", recheck);
    document.addEventListener("visibilitychange", recheck);

    return () => {
      window.removeEventListener("focus", recheck);
      window.removeEventListener("orientationchange", recheck);
      document.removeEventListener("visibilitychange", recheck);
    };
  }, []);

  return null;
}
