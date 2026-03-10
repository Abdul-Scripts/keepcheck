"use client";

import { useEffect } from "react";

export default function ConnectivityMode() {
  useEffect(() => {
    const body = document.body;

    const applyState = () => {
      if (navigator.onLine) {
        body.classList.remove("is-offline");
      } else {
        body.classList.add("is-offline");
      }
    };

    applyState();
    window.addEventListener("online", applyState);
    window.addEventListener("offline", applyState);

    return () => {
      window.removeEventListener("online", applyState);
      window.removeEventListener("offline", applyState);
    };
  }, []);

  return null;
}
