"use client";

import { useState } from "react";
import AdminNav from "@/components/AdminNav";
import { Loader2, Database, CheckCircle, AlertTriangle } from "lucide-react";

export default function SeedPage() {
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [result, setResult] = useState(null);

  const runSeed = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      setResult(data);
      setStatus(data.success ? "success" : "error");
    } catch (e) {
      setResult({ error: e.message });
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <AdminNav />
      <div className="max-w-lg mx-auto w-full p-8 flex flex-col items-center gap-6 mt-12">

        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-violet-500/30">
          <Database size={28} className="text-white" />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-black">Database Seeder</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Populate Firestore with <strong className="text-slate-300">8 categories</strong> and{" "}
            <strong className="text-slate-300">57 menu items</strong> for Noor al Mandi.
          </p>
        </div>

        <div className="w-full bg-slate-900 border border-amber-500/30 rounded-2xl p-4">
          <p className="text-amber-400 text-sm font-bold flex items-center gap-2">
            <AlertTriangle size={16} /> Run only ONCE
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Running this multiple times will create duplicate categories and products. If you have already seeded, do not click again.
          </p>
        </div>

        {status !== "success" && (
          <button
            onClick={runSeed}
            disabled={status === "loading"}
            className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-violet-600/30 transition-all"
          >
            {status === "loading" ? (
              <><Loader2 size={22} className="animate-spin" /> Seeding… this may take a moment</>
            ) : (
              <><Database size={22} /> Seed Database</>
            )}
          </button>
        )}

        {status === "success" && result && (
          <div className="w-full bg-green-500/10 border border-green-500/30 rounded-2xl p-5">
            <p className="text-green-400 font-bold flex items-center gap-2 mb-2">
              <CheckCircle size={18} /> {result.message}
            </p>
            {result.errors?.length > 0 && (
              <div className="mt-3">
                <p className="text-amber-400 text-xs font-bold mb-1">⚠️ Some errors:</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-slate-500">{e}</p>
                ))}
              </div>
            )}
            <p className="text-slate-500 text-xs mt-3">
              Go to <a href="/admin/products" className="text-violet-400 underline">/admin/products</a> or{" "}
              <a href="/admin/categories" className="text-violet-400 underline">/admin/categories</a> to see your data.
            </p>
          </div>
        )}

        {status === "error" && result && (
          <div className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
            <p className="text-red-400 font-bold mb-1">❌ Seed failed</p>
            <p className="text-xs text-slate-500">{result.error}</p>
          </div>
        )}

      </div>
    </div>
  );
}
