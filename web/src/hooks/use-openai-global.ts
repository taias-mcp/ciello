/**
 * Hook to subscribe to window.openai global values
 * Based on openai/openai-apps-sdk-examples/src/use-openai-global.ts
 */

import { useSyncExternalStore } from "react";
import type { OpenAiGlobals, SetGlobalsEvent } from "../types/openai";

const SET_GLOBALS_EVENT_TYPE = "openai:set_globals";

export function useOpenAiGlobal<K extends keyof OpenAiGlobals>(
  key: K
): OpenAiGlobals[K] | null {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      const handleSetGlobal = (event: SetGlobalsEvent) => {
        const value = event.detail.globals[key];
        if (value === undefined) {
          return;
        }
        onChange();
      };

      window.addEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal as EventListener, {
        passive: true,
      });

      return () => {
        window.removeEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal as EventListener);
      };
    },
    () => window.openai?.[key] ?? null,
    () => window.openai?.[key] ?? null
  );
}

