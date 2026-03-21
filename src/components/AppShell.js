"use client";

import { useState } from "react";
import SplashScreen from "@/components/SplashScreen";

/**
 * Wraps the app with a one-time splash screen on first load.
 * After the splash fades out, children render normally.
 */
export default function AppShell({ children }) {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      {children}
    </>
  );
}
