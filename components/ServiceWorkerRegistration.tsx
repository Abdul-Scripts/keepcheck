"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const envBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
        const runtimeBasePath = (() => {
          if (typeof window === "undefined") return "";
          const host = window.location.hostname;
          const firstSegment = window.location.pathname
            .split("/")
            .filter(Boolean)[0];

          // GitHub Pages project sites are served from /<repo>.
          if (!envBasePath && host.endsWith(".github.io") && firstSegment) {
            return `/${firstSegment}`;
          }
          return envBasePath;
        })();

        await navigator.serviceWorker.register(`${runtimeBasePath}/sw.js`, {
          scope: `${runtimeBasePath}/`,
          updateViaCache: "none",
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
