"use client";

import { useState, useEffect } from "react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Smartphone, Download, X } from "lucide-react";

export default function InstallPrompt() {
  const { canInstall, triggerInstall } = useInstallPrompt();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Show the prompt only after 5 seconds to not annoy the user immediately
    // and only if it hasn't been dismissed in this session
    const checkDismissed = sessionStorage.getItem("pwa-prompt-dismissed");
    
    if (canInstall && !isDismissed && !checkDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [canInstall, isDismissed]);

  if (!canInstall || !isVisible || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-[60] animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-emerald-100 p-4 flex items-center gap-4 relative overflow-hidden">
        {/* Progress background decoration */}
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
        
        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Smartphone className="text-emerald-600" size={24} />
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-900 leading-tight">Install Noor al Mandi </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Add to home screen for a faster, app-like experience.</p>
        </div>

        <button
          onClick={triggerInstall}
          className="bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl active:scale-95 transition-transform flex items-center gap-2 shadow-sm"
        >
          <Download size={14} />
          Install
        </button>

        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-slate-300 hover:text-slate-500 active:scale-90"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
