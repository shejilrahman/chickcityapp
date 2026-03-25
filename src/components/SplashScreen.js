"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

/* ──────────────────────────────────────────────────────────────────────────
   Enhanced Splash Screen for Noor Al Mandi
   • Now features the heroic chef mascot (person.png) as the dramatic centerpiece
   • Richer gold glows, deeper shadows, and cinematic entrance animation
   • Chef appears first with a powerful "hero reveal" scale + glow effect
   • All original luxury elements preserved + upgraded (stronger vignette, thicker gold rules, refined typography)
   • Color palette strictly from the poster: navy #0d1654, gold #c9a227 / #f5d171, accent #fff8e8
────────────────────────────────────────────────────────────────────────── */

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0); // 0 → dark  1 → chef reveal  2 → brand text  3 → full details
  const [loadPercent, setLoadPercent] = useState(0);

  useEffect(() => {
    const loadInterval = setInterval(() => {
      setLoadPercent((prev) => {
        if (prev >= 100) {
          clearInterval(loadInterval);
          return 100;
        }
        return prev + 1.8; // faster, more satisfying fill
      });
    }, 32);

    const t1 = setTimeout(() => setPhase(1), 300);   // chef appears early
    const t2 = setTimeout(() => setPhase(2), 850);
    const t3 = setTimeout(() => setPhase(3), 1450);
    const t4 = setTimeout(() => onDone?.(), 4200);

    return () => {
      clearInterval(loadInterval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden" style={{ background: "#0d1654" }}>

      {/* Deep navy cinematic vignette */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 75% 55% at 50% 48%, #1a2a80 0%, #0d1654 58%, #070e38 100%)",
      }} />

      {/* Luxurious gold geometric tile overlay (more subtle & elegant) */}
      <div className="absolute inset-0 opacity-[0.055]" style={{
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 42px, rgba(201,162,39,0.85) 43px),
          repeating-linear-gradient(90deg, transparent, transparent 42px, rgba(201,162,39,0.85) 43px)
        `,
      }} />

      {/* Thicker, more radiant top & bottom gold rule lines */}
      <div className="absolute top-0 left-0 right-0 h-[4px]" style={{
        background: "linear-gradient(90deg, transparent, #c9a227 25%, #f5d171 50%, #c9a227 75%, transparent)",
        boxShadow: "0 0 18px rgba(245,209,113,0.6)",
      }} />
      <div className="absolute bottom-0 left-0 right-0 h-[4px]" style={{
        background: "linear-gradient(90deg, transparent, #c9a227 25%, #f5d171 50%, #c9a227 75%, transparent)",
        boxShadow: "0 0 18px rgba(245,209,113,0.6)",
      }} />

      {/* Arabic arch frame – slightly larger and more ornate */}
      <div className={`absolute inset-x-4 top-8 bottom-8 transition-all duration-700 ${phase >= 1 ? "opacity-100 scale-100" : "opacity-30 scale-95"}`}>
        <svg viewBox="0 0 320 560" fill="none" className="w-full h-full" preserveAspectRatio="none">
          {/* Outer glowing arch */}
          <path
            d="M8,325 L8,75 Q8,8 85,8 L160,8 L235,8 Q312,8 312,75 L312,325"
            stroke="#c9a227" strokeWidth="3.5" fill="none" strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 12px rgba(201,162,39,0.85))" }}
          />
          {/* Inner dashed arch */}
          <path
            d="M26,312 L26,88 Q26,28 92,28 L160,28 L228,28 Q294,28 294,88 L294,312"
            stroke="#a07c15" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="10 6"
          />
          {/* Keystone jewel */}
          <circle cx="160" cy="8" r="8" fill="#f5d171" style={{ filter: "drop-shadow(0 0 8px #f5d171)" }} />
          <circle cx="160" cy="8" r="4" fill="#fff8e8" />
          {/* Corner rosettes */}
          {[[8,8],[312,8]].map(([x,y],i) => (
            <g key={i} transform={`translate(${x},${y})`}>
              <circle cx="0" cy="0" r="6" fill="none" stroke="#f5d171" strokeWidth="2"/>
              <circle cx="0" cy="0" r="2.5" fill="#c9a227"/>
            </g>
          ))}
        </svg>
      </div>

      {/* Radial gold glow behind the chef */}
      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[420px] transition-all duration-1000 pointer-events-none ${phase >= 1 ? "opacity-70 scale-100" : "opacity-0 scale-75"}`}
        style={{
          background: "radial-gradient(circle, rgba(245,209,113,0.22) 20%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center px-8 text-center">

        {/* HERO CHEF MASCOT – the star of the new splash */}
        <div className={`mb-4 sm:mb-8 transition-all duration-1000 ${phase >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
          <div
            className="w-[50vw] max-w-[240px] sm:max-w-[310px] mx-auto relative"
            style={{
              // Use aspect ratio block for next/image
              aspectRatio: "1/1",
              filter: `
                drop-shadow(0 25px 20px rgba(201,162,39,0.55))
                drop-shadow(0 0 35px rgba(245,209,113,0.4))
              `,
              transition: "filter 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <Image
              src="/person.png"
              alt="Noor Al Mandi Hero Chef"
              fill
              className="object-contain"
              sizes="(max-width: 640px) 240px, 310px"
              priority
            />
          </div>
        </div>

        {/* Brand Name – appears after chef for perfect hierarchy */}
        <div className={`transition-all duration-700 ${phase >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          <p style={{
            fontFamily: "var(--font-cinzel), 'Cinzel', Georgia, serif",
            fontSize: "clamp(11px, 3.5vw, 14px)",
            letterSpacing: "0.4em",
            color: "#f5d171",
            textShadow: "0 0 14px rgba(245,209,113,0.8), 0 0 28px rgba(201,162,39,0.5)",
            fontWeight: 700,
            marginBottom: "4px",
            textTransform: "uppercase",
          }}>
            Noor Al
          </p>
          <h1 style={{
            fontFamily: "var(--font-cinzel), 'Cinzel', Georgia, serif",
            fontSize: "clamp(42px, 12vw, 56px)",
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "0.07em",
            color: "#ffffff",
            textShadow: "0 0 12px rgba(245,209,113,0.6), 0 4px 20px rgba(0,0,10,0.95)",
            margin: 0,
          }}>
            MANDI
          </h1>
        </div>

        {/* Ornamental divider – appears last */}
        <div className={`flex items-center gap-3 my-4 sm:my-5 transition-all duration-700 ${phase >= 3 ? "opacity-100" : "opacity-0"}`}>
          <div style={{ width: "58px", height: "2px", background: "linear-gradient(to left, #c9a227, transparent)" }} />
          <span style={{ color: "#f5d171", fontSize: "18px", lineHeight: 1, textShadow: "0 0 10px rgba(201,162,39,0.9)" }}>✦</span>
          <div style={{ width: "58px", height: "2px", background: "linear-gradient(to right, #c9a227, transparent)" }} />
        </div>

        {/* Tagline */}
        <p className={`transition-all duration-700 ${phase >= 3 ? "opacity-100" : "opacity-0"}`}
          style={{
            fontFamily: "var(--font-cinzel), Georgia, serif",
            fontSize: "clamp(8px, 2.5vw, 9.5px)",
            letterSpacing: "0.32em",
            color: "#c9a227cc",
            textTransform: "uppercase",
            fontWeight: 700,
          }}>
          Arabic Mandi · Al Fahm · Grills
        </p>

        {/* Halal + Location badges */}
        <div className={`mt-6 sm:mt-10 flex items-center justify-center flex-wrap gap-2.5 sm:gap-4 transition-all duration-700 ${phase >= 3 ? "opacity-100" : "opacity-0"}`}>
          <div style={{
            border: "2px solid rgba(201,162,39,0.6)",
            borderRadius: "9999px",
            padding: "4px 14px sm:18px",
            background: "rgba(201,162,39,0.09)",
            boxShadow: "0 0 12px rgba(201,162,39,0.3)",
          }}>
            <span style={{
              fontFamily: "var(--font-cinzel), Georgia, serif",
              fontSize: "clamp(8px, 2.5vw, 9.5px)",
              letterSpacing: "0.32em",
              color: "#f5d171",
              textTransform: "uppercase",
              fontWeight: 700,
            }}>☪ Halal Certified</span>
          </div>

          <div style={{
            border: "2px solid rgba(201,162,39,0.6)",
            borderRadius: "9999px",
            padding: "4px 14px sm:18px",
            background: "rgba(201,162,39,0.09)",
            boxShadow: "0 0 12px rgba(201,162,39,0.3)",
          }}>
            <span style={{
              fontFamily: "var(--font-cinzel), Georgia, serif",
              fontSize: "clamp(8px, 2.5vw, 9.5px)",
              letterSpacing: "0.28em",
              color: "#f5d171",
              textTransform: "uppercase",
              fontWeight: 700,
            }}>📍 Thriprayar</span>
          </div>
        </div>
      </div>

      {/* Premium loading bar – thicker, brighter, with extra glow */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[160px]">
        <div style={{
          height: "3px",
          background: "rgba(201,162,39,0.25)",
          borderRadius: "9999px",
          overflow: "hidden",
          boxShadow: "0 0 8px rgba(201,162,39,0.4)",
        }}>
          <div style={{
            height: "100%",
            width: `${Math.min(loadPercent, 100)}%`,
            background: "linear-gradient(90deg, #a07c15, #f5d171, #c9a227)",
            boxShadow: "0 0 14px rgba(245,209,113,0.7)",
            transition: "width 0.08s linear",
          }} />
        </div>
      </div>

      {/* Corner corner ornaments – now with extra glow */}
      {["top-4 left-4", "top-4 right-4", "bottom-4 left-4", "bottom-4 right-4"].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-9 h-9 pointer-events-none transition-opacity duration-700 ${phase >= 1 ? "opacity-70" : "opacity-0"}`}>
          <svg viewBox="0 0 32 32" fill="none">
            <path
              d={i < 2 ? "M3 3 L3 13 M3 3 L13 3" : "M3 29 L3 19 M3 29 L13 29"}
              stroke="#f5d171"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 6px rgba(245,209,113,0.7))" }}
              transform={i % 2 === 1 ? "scale(-1,1) translate(-32,0)" : ""}
            />
          </svg>
        </div>
      ))}
    </div>
  );
}