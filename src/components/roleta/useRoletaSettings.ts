"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_ROLETA_SETTINGS,
  parseRoletaSettings,
  ROLETA_STORAGE_KEY,
  type RoletaSettings,
} from "@/lib/roleta";

let memory = DEFAULT_ROLETA_SETTINGS;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function readSettings(): RoletaSettings {
  if (typeof window === "undefined") return DEFAULT_ROLETA_SETTINGS;
  if (!loaded) {
    loaded = true;
    try {
      const raw = window.localStorage.getItem(ROLETA_STORAGE_KEY);
      if (raw) memory = parseRoletaSettings(JSON.parse(raw) as unknown);
    } catch {
      memory = DEFAULT_ROLETA_SETTINGS;
    }
  }
  return memory;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRoletaSettings() {
  const settings = useSyncExternalStore(subscribe, readSettings, () => DEFAULT_ROLETA_SETTINGS);

  const patch = useCallback((partial: Partial<RoletaSettings>) => {
    memory = { ...readSettings(), ...partial };
    window.localStorage.setItem(ROLETA_STORAGE_KEY, JSON.stringify(memory));
    emit();
  }, []);

  return { settings, patch };
}
