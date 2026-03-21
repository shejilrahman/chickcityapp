import { WifiOff, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-8 text-center">
      <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-8 relative">
        <WifiOff className="text-slate-400" size={40} />
        {/* Animated pulse */}
        <div className="absolute inset-0 bg-emerald-500/10 rounded-3xl animate-ping scale-110" />
      </div>

      <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">You&apos;re Offline</h1>
      <p className="text-slate-500 mb-8 max-w-[240px] leading-relaxed">
        Please check your internet connection. We&apos;ll be ready for your order as soon as you&apos;re back online!
      </p>

      <button 
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 bg-emerald-600 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-transform"
      >
        <RefreshCcw size={18} />
        Try Again
      </button>

      <Link 
        href="/"
        className="mt-6 text-emerald-600 font-bold text-sm hover:underline"
      >
        Back to Home
      </Link>
    </div>
  );
}
