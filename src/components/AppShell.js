"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import SplashScreen from "@/components/SplashScreen";

export default function AppShell({ children }) {
  const [splashDone, setSplashDone] = useState(false);
  const pathname = usePathname();
  
  // Admin pages should stay full-width
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      
      {isAdmin ? (
        <div className="min-h-screen bg-slate-950">
          {children}
        </div>
      ) : (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center">
          <div className="w-full max-w-md min-h-screen bg-white shadow-[0_0_60px_rgba(0,0,0,0.08)] relative flex flex-col">
            {children}
          </div>
        </div>
      )}
    </>
  );
}
