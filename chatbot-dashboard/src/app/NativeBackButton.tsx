//src/app/NativeBackButton.tsx
"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";

export default function NativeBackButton() {
  useEffect(() => {
    if (
      !Capacitor.isNativePlatform() ||
      Capacitor.getPlatform() !== "android"
    ) {
      return;
    }

    let listener: PluginListenerHandle | null = null;
    let cancelled = false;

    const registerListener = async () => {
      const registeredListener = await App.addListener(
        "backButton",
        ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
            return;
          }

          void App.exitApp();
        },
      );

      if (cancelled) {
        await registeredListener.remove();
        return;
      }

      listener = registeredListener;
    };

    void registerListener();

    return () => {
      cancelled = true;

      if (listener) {
        void listener.remove();
      }
    };
  }, []);

  return null;
}