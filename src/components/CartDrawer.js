"use client";

import { useCart } from "./CartContext";
import { ShoppingBag, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const MIN_ORDER = 300;

export default function CartDrawer() {
  const { totalItems, totalPrice } = useCart();
  const router = useRouter();

  const meetsMinimum = totalPrice >= MIN_ORDER;
  const remaining = Math.max(0, MIN_ORDER - totalPrice);
  const progress = Math.min(100, (totalPrice / MIN_ORDER) * 100);

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed bottom-0 left-[72px] right-0 z-50 px-4 pb-6 safe-bottom pointer-events-none"
        >
          <div className="max-w-lg mx-auto pointer-events-auto space-y-2">

            {/* Minimum order progress — shown only when below ₹300 */}
            {!meetsMinimum && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/95 backdrop-blur-sm border border-orange-200 rounded-2xl px-4 py-3 shadow-lg"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-bold text-orange-700 flex items-center gap-1.5">
                    <Lock size={11} />
                    Add ₹{remaining.toFixed(0)} more to place order
                  </span>
                  <span className="text-[11px] font-black text-orange-500">
                    ₹{totalPrice.toFixed(0)} / ₹{MIN_ORDER}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            )}

            {/* Cart pill button */}
            <button
              onClick={() => meetsMinimum && router.push("/cart")}
              disabled={!meetsMinimum}
              className="w-full text-white rounded-2xl px-5 py-4 shadow-2xl flex items-center justify-between active:scale-[0.98] transition-transform disabled:cursor-not-allowed"
              style={
                meetsMinimum
                  ? {
                      background: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #a855f7 100%)",
                      boxShadow: "0 8px 32px rgba(124, 34, 235, 0.38)",
                    }
                  : {
                      background: "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                    }
              }
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/15 border border-white/20 rounded-xl flex items-center justify-center">
                    {meetsMinimum ? <ShoppingBag size={20} /> : <Lock size={18} />}
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 bg-yellow-300 text-purple-900 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-white/60 leading-none mb-0.5">
                    {meetsMinimum ? "Your Cart" : "Min. ₹300 required"}
                  </p>
                  <p className="font-bold text-[15px] leading-none">
                    {totalItems} item{totalItems !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs text-white/60 leading-none mb-0.5">Total</p>
                  <p className="font-black text-xl leading-none">
                    ₹{typeof totalPrice === "number" ? totalPrice.toFixed(2) : totalPrice}
                  </p>
                </div>
                {meetsMinimum && (
                  <div className="w-8 h-8 bg-white/20 border border-white/25 rounded-xl flex items-center justify-center ml-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                    </svg>
                  </div>
                )}
              </div>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
