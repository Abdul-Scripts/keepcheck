"use client";

import { useEffect } from "react";
import { assetPath } from "@/lib/assetPath";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const swUrl = assetPath("/sw.js");
        await navigator.serviceWorker.register(swUrl, {
          scope: assetPath("/") ,
        });
        console.log("Service worker registered");
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };

    register();
  }, []);

  return null;
}
