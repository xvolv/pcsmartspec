"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register service worker (works in dev too, but typically only prompts in production/HTTPS)
            navigator.serviceWorker
              .register("/sw.js")
              .catch(() => {
                // Service Worker registration failed silently
              });
    }
  }, []);

  return null;
}
