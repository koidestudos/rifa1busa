"use client";

import { useEffect } from "react";

export function SessionGuard({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function verify() {
      try {
        const response = await fetch("/api/session", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!cancelled && response.status === 401) {
          window.location.replace("/login");
        }
      } catch {
        // keep the current screen if the check fails transiently
      }
    }

    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        void verify();
      }
    }

    function onVisible() {
      if (document.visibilityState === "visible") void verify();
    }

    void verify();
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled]);

  return null;
}
