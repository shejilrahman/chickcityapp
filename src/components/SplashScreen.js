"use client";

import { useEffect, useState } from "react";

/**
 * SplashScreen — shown once on first app open.
 * Fades out after ~2.2 s and is never shown again during the session.
 */
export default function SplashScreen({ onDone }) {
  // Phase: "enter" → "hold" → "exit"
  const [phase, setPhase] = useState("enter");

  useEffect(() => {
    // Start logo animation
    const holdTimer = setTimeout(() => setPhase("exit"), 2000);
    // Remove splash from DOM after fade-out completes
    const doneTimer = setTimeout(() => onDone?.(), 2600);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #4c1d95 0%, #6d28d9 35%, #7c3aed 65%, #a855f7 100%)",
        transition: phase === "exit" ? "opacity 0.55s ease, transform 0.55s ease" : "none",
        opacity: phase === "exit" ? 0 : 1,
        transform: phase === "exit" ? "scale(1.04)" : "scale(1)",
        pointerEvents: phase === "exit" ? "none" : "auto",
      }}
    >
      {/* Background decorative circles */}
      <div style={{
        position: "absolute", top: "-80px", right: "-80px",
        width: "320px", height: "320px", borderRadius: "50%",
        background: "rgba(255,255,255,0.06)",
      }} />
      <div style={{
        position: "absolute", bottom: "-60px", left: "-60px",
        width: "240px", height: "240px", borderRadius: "50%",
        background: "rgba(255,255,255,0.05)",
      }} />
      <div style={{
        position: "absolute", top: "30%", left: "10%",
        width: "80px", height: "80px", borderRadius: "50%",
        border: "1.5px solid rgba(255,255,255,0.12)",
      }} />
      <div style={{
        position: "absolute", bottom: "25%", right: "8%",
        width: "50px", height: "50px", borderRadius: "50%",
        border: "1.5px solid rgba(255,255,255,0.10)",
      }} />

      {/* Main content */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        animation: "splashSlideUp 0.55s cubic-bezier(.22,.68,0,1.2) both",
      }}>
        {/* Logo icon */}
        <div style={{
          width: "96px", height: "96px", borderRadius: "28px",
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(12px)",
          border: "1.5px solid rgba(255,255,255,0.28)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "48px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.25)",
          marginBottom: "24px",
        }}>
          🛒
        </div>

        {/* Store name */}
        <h1 style={{
          color: "#fff",
          fontSize: "34px",
          fontWeight: "900",
          letterSpacing: "-0.5px",
          lineHeight: 1,
          marginBottom: "6px",
          textShadow: "0 2px 12px rgba(0,0,0,0.18)",
        }}>
          Palathingal
        </h1>

        {/* "Stores" badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "4px",
          background: "rgba(255,255,255,0.18)",
          border: "1px solid rgba(255,255,255,0.28)",
          borderRadius: "20px",
          padding: "3px 12px",
          marginBottom: "16px",
        }}>
          <span style={{ fontSize: "12px" }}>✨</span>
          <span style={{ color: "#fff", fontSize: "13px", fontWeight: "700", letterSpacing: "0.5px" }}>
            STORES
          </span>
        </div>

        {/* Tagline */}
        <p style={{
          color: "rgba(255,255,255,0.70)",
          fontSize: "14px",
          fontWeight: "500",
          letterSpacing: "0.3px",
        }}>
          Fresh · Local · Fast
        </p>
      </div>

      {/* Loading dots at the bottom */}
      <div style={{
        position: "absolute", bottom: "60px",
        display: "flex", gap: "8px", alignItems: "center",
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: "7px", height: "7px", borderRadius: "50%",
            background: "rgba(255,255,255,0.55)",
            animation: `splashDot 1s ${i * 0.18}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>

      {/* Keyframe animations injected inline */}
      <style>{`
        @keyframes splashSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes splashDot {
          from { opacity: 0.3; transform: translateY(0); }
          to   { opacity: 1;   transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
