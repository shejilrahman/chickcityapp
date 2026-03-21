"use client";

import OrderTracker from "@/components/OrderTracker";
import { ArrowLeft, Package } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OrdersPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f0f7f0] pb-10">
      {/* Header */}
      <header className="glass border-b border-gray-100 px-4 py-4 sticky top-0 z-40 flex items-center gap-3 safe-top">
        <button
          onClick={() => router.push("/")}
          className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center active:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div className="w-10 h-10 bg-green-600 rounded-2xl flex items-center justify-center shadow-md shadow-green-600/25">
          <Package size={20} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-[18px] font-black text-gray-900 leading-none">Your Orders</h1>
          <p className="text-xs text-gray-400 mt-0.5">Real-time tracking</p>
        </div>
      </header>

      <main className="px-4 pt-4">
        <OrderTracker />
      </main>
    </div>
  );
}
