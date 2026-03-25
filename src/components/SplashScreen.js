"use client";

import { useState, useEffect } from "react";

export default function SplashScreen({ onDone }) {
  const [isFlickerBrand, setIsFlickerBrand] = useState(false);
  const [isFlickerSub, setIsFlickerSub] = useState(false);
  const [showOtherElements, setShowOtherElements] = useState(false);
  const [loadPercent, setLoadPercent] = useState(0);

  useEffect(() => {
    // 1. Loading bar progress
    const loadInterval = setInterval(() => {
      setLoadPercent(prev => {
        if (prev >= 100) {
          clearInterval(loadInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    // 2. Animation sequence
    const timer1 = setTimeout(() => setIsFlickerBrand(true), 800);
    const timer2 = setTimeout(() => setIsFlickerSub(true), 1400); // 800 + 600
    const timer3 = setTimeout(() => setShowOtherElements(true), 1600);
    
    // 3. Complete splash after 4.5 seconds
    const timerComplete = setTimeout(() => onDone?.(), 4500);

    return () => {
      clearInterval(loadInterval);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerComplete);
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex items-center justify-center overflow-hidden font-serif">
      {/* Dark bg structure */}
      <div className="absolute inset-0 opacity-[0.05]" style={{ background: "repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.012) 60px)" }} />
      
      {/* Glow blooms */}
      <div className={`absolute top-[-60px] left-1/2 -translate-x-1/2 w-[340px] h-[280px] transition-all duration-[1200ms] pointer-events-none
        ${isFlickerBrand ? "bg-[radial-gradient(ellipse,rgba(220,30,30,0.22)_0%,transparent_70%)]" : "bg-transparent"}
      `} />
      <div className={`absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-[300px] h-[200px] transition-all duration-[1400ms] pointer-events-none
        ${showOtherElements ? "bg-[radial-gradient(ellipse,rgba(180,90,20,0.13)_0%,transparent_70%)]" : "bg-transparent"}
      `} />

      <div className="relative z-10 flex flex-col items-center">
        {/* Bird Logo SVG */}
        <div className={`mb-[22px] transition-opacity duration-700 ${showOtherElements ? "opacity-100" : "opacity-0"}`}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <ellipse cx="40" cy="48" rx="20" ry="16" fill="#cc2a1a"/>
            <circle cx="40" cy="26" r="12" fill="#cc2a1a"/>
            <polygon points="40,30 48,33 40,36" fill="#e8a020"/>
            <path d="M34 16 Q36 10 38 16 Q40 9 42 16 Q44 10 46 16" stroke="#e8a020" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <circle cx="44" cy="24" r="2.5" fill="#fff"/>
            <circle cx="44.8" cy="24" r="1.2" fill="#111"/>
            <path d="M22 46 Q18 40 24 36 Q30 42 28 50 Z" fill="#b02010"/>
            <path d="M58 44 Q66 38 64 50 Q60 52 56 50 Z" fill="#b02010"/>
            <line x1="34" y1="63" x2="30" y2="74" stroke="#e8a020" stroke-width="3" stroke-linecap="round"/>
            <line x1="46" y1="63" x2="50" y2="74" stroke="#e8a020" stroke-width="3" stroke-linecap="round"/>
            <line x1="30" y1="74" x2="25" y2="74" stroke="#e8a020" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="50" y1="74" x2="55" y2="74" stroke="#e8a020" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>

        {/* Brand Name with flicker animation */}
        <div className="text-center">
          <h1 className={`m-0 text-[44px] font-[800] tracking-[3px] leading-none transition-all duration-300
            ${isFlickerBrand 
              ? "text-[#e8281a] [text-shadow:0_0_8px_#e8281a,0_0_20px_#e8281a,0_0_40px_rgba(232,40,26,0.6)] animate-[flicker_0.6s_ease_forwards]" 
              : "text-[#1a0a0a]"}
          `}>
            ABC 
          </h1>

          <div className={`flex items-center justify-center gap-[6px] my-[8px] transition-opacity duration-800 ${showOtherElements ? "opacity-100" : "opacity-0"}`}>
            <div className="w-[50px] h-[1px]" style={{ background: "linear-gradient(to left,#e8281a,transparent)" }} />
            <div className="w-1.5 h-1.5 bg-[#e8281a] rounded-full shadow-[0_0_8px_#e8281a]" />
            <div className="w-[50px] h-[1px]" style={{ background: "linear-gradient(to right,#e8281a,transparent)" }} />
          </div>

          <p className={`m-0 text-[11px] tracking-[5px] uppercase font-[400] transition-all duration-300
            ${isFlickerSub 
              ? "text-white [text-shadow:0_0_8px_rgba(255,255,255,0.9),0_0_20px_rgba(255,255,255,0.4)] animate-[flicker_0.7s_ease_forwards]" 
              : "text-white/20"}
          `}>
            Family Restaurant
          </p>
        </div>

        {/* Tagline Badge */}
        <div className={`mt-[48px] bg-[rgba(232,73,58,0.1)] border border-[rgba(232,73,58,0.25)] rounded-full px-[20px] py-[8px] flex items-center gap-[8px] transition-opacity duration-1000
          ${showOtherElements ? "opacity-100" : "opacity-0"}
        `}>
          <div className="w-[6px] h-[6px] bg-[#e8281a] rounded-full shadow-[0_0_5px_#e8281a]" />
          <p className="m-0 text-[11px] text-[#e8a090] tracking-[2px] uppercase">Al Fahm · Mandi · Grills</p>
          <div className="w-[6px] h-[6px] bg-[#e8281a] rounded-full shadow-[0_0_5px_#e8281a]" />
        </div>

        {/* Loading bar footer */}
        <div className="m-10 absolute bottom-[28px] w-[130px] h-[2px] bg-[#1e1e1e] rounded-full overflow-hidden">
          <div className="h-full bg-[#e8281a] transition-all duration-300" style={{ width: `${loadPercent}%` }} />
        </div>
        {/* <p className="absolute bottom-[12px] text-[10px] text-[#333] tracking-[3px] uppercase">Welcome</p> */}
      </div>

      <style jsx global>{`
        @keyframes flicker {
          0%   { opacity:1; color: #1a0a0a; text-shadow: none; }
          5%   { opacity:0.2; color: #e8281a; text-shadow: 0 0 8px #e8281a; }
          10%  { opacity:1; color: #e8281a; text-shadow: 0 0 20px #e8281a; }
          15%  { opacity:0.5; color: #3a0a0a; text-shadow: none; }
          20%  { opacity:1; color: #e8281a; text-shadow: 0 0 8px #e8281a; }
          100% { opacity:1; color: #e8281a; text-shadow: 0 0 20px #e8281a, 0 0 40px rgba(232,40,26,0.6); }
        }
      `}</style>
    </div>
  );
}
