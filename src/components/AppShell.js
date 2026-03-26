"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import SplashScreen from "@/components/SplashScreen";
import BottomNav from "@/components/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";

export default function AppShell({ children }) {
  // Use null as initial "unknown" state to avoid flash
  const [splashDone, setSplashDone] = useState(null);
  const pathname = usePathname();
  
  const isAdmin = pathname?.startsWith("/admin");
  const isOfflinePage = pathname === "/offline";
  const isCartPage = pathname === "/cart";

  useEffect(() => {
    // Check sessionStorage so splash only shows ONCE per browser session
    const alreadySeen = sessionStorage.getItem("splash-seen");
    if (alreadySeen) {
      setSplashDone(true);
    } else {
      setSplashDone(false);
    }
  }, []);

  const handleSplashDone = () => {
    sessionStorage.setItem("splash-seen", "1");
    setSplashDone(true);
  };

  // While checking sessionStorage, render nothing to avoid flicker
  if (splashDone === null) return null;

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}
      
      {isAdmin ? (
        <div className="min-h-screen bg-slate-950">
          {children}
        </div>
      ) : (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center">
          <div className="w-full max-w-md min-h-screen bg-white shadow-[0_0_60px_rgba(0,0,0,0.08)] relative flex flex-col">
            <div className={(!isOfflinePage && !isCartPage) ? "flex-1 pb-16" : "flex-1"}>
              {children}
            </div>
            {!isOfflinePage && !isCartPage && <BottomNav />}
            <InstallPrompt />
          </div>
        </div>
      )}
    </>
  );
}
