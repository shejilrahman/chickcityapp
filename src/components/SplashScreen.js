"use client";

import { useState, useEffect } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Colour palette from the Noor al Mandi poster
   - bg:      rich navy  #0d1a5e / #111f6e
   - gold:    warm gold  #c9a227 / #f5d171
   - border:  deep gold  #a07c15
   - accent:  cream      #fff8e8
────────────────────────────────────────────────────────────────────────── */

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0); // 0 → dark  1 → logo in  2 → text  3 → full
  const [loadPercent, setLoadPercent] = useState(0);

  useEffect(() => {
    const loadInterval = setInterval(() => {
      setLoadPercent(prev => {
        if (prev >= 100) { clearInterval(loadInterval); return 100; }
        return prev + 1.2;
      });
    }, 40);

    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1400);
    const t4 = setTimeout(() => onDone?.(), 4200);

    return () => {
      clearInterval(loadInterval);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden" style={{ background: "#0d1654" }}>

      {/* ── Deep navy vignette bg ── */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 50%, #1a2a80 0%, #0d1654 60%, #070e38 100%)"
      }} />

      {/* ── Gold geometric tiled border overlay ── */}
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(201,162,39,0.8) 40px),
          repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(201,162,39,0.8) 40px)
        `,
      }} />

      {/* ── Top and bottom gold rule lines ── */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, transparent, #c9a227 30%, #f5d171 50%, #c9a227 70%, transparent)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, transparent, #c9a227 30%, #f5d171 50%, #c9a227 70%, transparent)" }} />

      {/* ── Arabic arch frame ── */}
      <div className={`absolute inset-x-6 top-10 bottom-10 transition-opacity duration-700 ${phase >= 1 ? "opacity-100" : "opacity-0"}`}>
        <svg viewBox="0 0 320 560" fill="none" className="w-full h-full" preserveAspectRatio="none">
          {/* Outer arch border */}
          <path
            d="M10,320 L10,80 Q10,10 80,10 L160,10 L240,10 Q310,10 310,80 L310,320"
            stroke="#c9a227" strokeWidth="2.5" fill="none" strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 6px rgba(201,162,39,0.7))" }}
          />
          {/* Inner arch */}
          <path
            d="M30,310 L30,90 Q30,30 90,30 L160,30 L230,30 Q290,30 290,90 L290,310"
            stroke="#a07c15" strokeWidth="1" fill="none" strokeLinecap="round" strokeDasharray="8 4"
          />
          {/* Arch keystone ornament */}
          <circle cx="160" cy="10" r="6" fill="#c9a227" style={{ filter: "drop-shadow(0 0 4px rgba(245,209,113,0.8))" }} />
          <circle cx="160" cy="10" r="3" fill="#fff8e8" />
          {/* Corner rosettes */}
          {[[10,10],[310,10]].map(([x,y],i) => (
            <g key={i} transform={`translate(${x},${y})`}>
              <circle cy="0" cx="0" r="5" fill="none" stroke="#c9a227" strokeWidth="1.5"/>
              <circle cy="0" cx="0" r="2" fill="#c9a227"/>
            </g>
          ))}
        </svg>
      </div>

      {/* ── Radial gold glow behind logo area ── */}
      <div className={`absolute w-[280px] h-[180px] top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 transition-opacity duration-1000 pointer-events-none ${phase >= 2 ? "opacity-100" : "opacity-0"}`}
        style={{ background: "radial-gradient(ellipse, rgba(201,162,39,0.18) 0%, transparent 70%)" }} />

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center px-8">

        {/* Calligraphic swirl / logo mark */}
        <div className={`mb-4 transition-all duration-700 ${phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"}`}>
          <svg width="72" height="52" viewBox="0 0 72 52" fill="none">
            {/* Stylised "NM" flourish inspired by poster logo */}
            <path d="M36 4 C24 4, 10 14, 10 26 C10 38, 22 48, 36 48 C50 48, 62 38, 62 26 C62 14, 50 4, 36 4Z"
              stroke="#c9a227" strokeWidth="1.5" fill="none"
              style={{ filter: "drop-shadow(0 0 5px rgba(201,162,39,0.7))" }}
            />
            <path d="M20 34 Q24 20 30 26 Q34 30 36 22 Q38 14 44 22 Q48 28 52 18"
              stroke="#f5d171" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 4px rgba(245,209,113,0.8))" }}
            />
            {/* Top flourish */}
            <path d="M29 8 Q36 2 43 8" stroke="#c9a227" strokeWidth="1.5" fill="none" strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 3px rgba(201,162,39,0.6))" }}
            />
            <circle cx="36" cy="3" r="2" fill="#f5d171"
              style={{ filter: "drop-shadow(0 0 4px rgba(245,209,113,1))" }}
            />
          </svg>
        </div>

        {/* Brand Name */}
        <div className={`text-center transition-all duration-700 ${phase >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          {/* "NOOR AL" */}
          <p style={{
            fontFamily: "var(--font-cinzel), 'Cinzel', Georgia, serif",
            fontSize: "13px",
            letterSpacing: "0.35em",
            color: "#f5d171",
            textShadow: "0 0 12px rgba(245,209,113,0.7), 0 0 30px rgba(201,162,39,0.4)",
            fontWeight: 700,
            marginBottom: "2px",
            textTransform: "uppercase",
          }}>
            Noor Al
          </p>

          {/* "MANDI" large */}
          <h1 style={{
            fontFamily: "var(--font-cinzel), 'Cinzel', Georgia, serif",
            fontSize: "52px",
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "0.08em",
            color: "#ffffff",
            textShadow: "0 0 10px rgba(245,209,113,0.5), 0 2px 16px rgba(0,0,10,0.9)",
            margin: 0,
          }}>
            MANDI
          </h1>
        </div>

        {/* Ornamental divider */}
        <div className={`flex items-center gap-3 my-4 transition-all duration-700 ${phase >= 3 ? "opacity-100" : "opacity-0"}`}>
          <div style={{ width: "50px", height: "1px", background: "linear-gradient(to left, #c9a227, transparent)" }} />
          <span style={{ color: "#c9a227", fontSize: "16px", lineHeight: 1,
            textShadow: "0 0 8px rgba(201,162,39,0.8)" }}>✦</span>
          <div style={{ width: "50px", height: "1px", background: "linear-gradient(to right, #c9a227, transparent)" }} />
        </div>

        {/* Tagline */}
        <p className={`text-center transition-all duration-700 ${phase >= 3 ? "opacity-100" : "opacity-0"}`}
          style={{
            fontFamily: "var(--font-cinzel), Georgia, serif",
            fontSize: "9px",
            letterSpacing: "0.3em",
            color: "#c9a22799",
            textTransform: "uppercase",
            fontWeight: 700,
          }}>
           Arabic Mandi · Al Fahm · Grills
        </p>

        {/* ── HALAL badge + location ── */}
        <div className={`mt-8 flex items-center gap-3 transition-all duration-700 ${phase >= 3 ? "opacity-100" : "opacity-0"}`}>
          <div style={{
            border: "1.5px solid rgba(201,162,39,0.5)", borderRadius: "999px",
            padding: "4px 14px",
            background: "rgba(201,162,39,0.08)"
          }}>
            <span style={{
              fontFamily: "var(--font-cinzel), Georgia, serif",
              fontSize: "9px", letterSpacing: "0.3em",
              color: "#f5d171", textTransform: "uppercase", fontWeight: 700,
            }}>☪ Halal Certified</span>
          </div>
          <div style={{
            border: "1.5px solid rgba(201,162,39,0.5)", borderRadius: "999px",
            padding: "4px 14px",
            background: "rgba(201,162,39,0.08)"
          }}>
            <span style={{
              fontFamily: "var(--font-cinzel), Georgia, serif",
              fontSize: "9px", letterSpacing: "0.25em",
              color: "#f5d171", textTransform: "uppercase", fontWeight: 700,
            }}>📍 Thriprayar</span>
          </div>
        </div>
      </div>

      {/* ── Loading bar ── */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2" style={{ width: "140px" }}>
        <div style={{ height: "2px", background: "rgba(201,162,39,0.2)", borderRadius: "999px", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: "999px",
            width: `${Math.min(loadPercent, 100)}%`,
            background: "linear-gradient(90deg, #a07c15, #f5d171, #c9a227)",
            boxShadow: "0 0 8px rgba(245,209,113,0.5)",
            transition: "width 0.1s linear",
          }} />
        </div>
      </div>

      {/* ── Corner ornaments ── */}
      {[
        "top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"
      ].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-8 h-8 pointer-events-none`}
          style={{ opacity: phase >= 1 ? 0.6 : 0, transition: "opacity 0.8s" }}>
          <svg viewBox="0 0 32 32" fill="none">
            <path d={i < 2
              ? "M2 2 L2 12 M2 2 L12 2"   // top corners
              : "M2 30 L2 20 M2 30 L12 30" // bottom corners
            }
              stroke="#c9a227" strokeWidth="2" strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 3px rgba(201,162,39,0.6))" }}
              transform={i % 2 === 1 ? "scale(-1,1) translate(-32,0)" : ""}
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
