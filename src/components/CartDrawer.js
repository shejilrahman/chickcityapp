"use client";

import { useCart } from "./CartContext";
import { Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MIN_ORDER = 300;

export default function CartDrawer() {
  const { totalItems, totalPrice } = useCart();

  const meetsMinimum = totalPrice >= MIN_ORDER;
  const remaining = Math.max(0, MIN_ORDER - totalPrice);

  // Only show the "add more" hint, nothing else
  if (totalItems === 0 || meetsMinimum) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        className="fixed bottom-[68px] left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40 pointer-events-none"
      >
        <div className="flex items-center justify-center gap-1.5 bg-orange-50/90 border border-orange-200 backdrop-blur-sm rounded-full py-1.5 px-4 shadow-sm pointer-events-auto">
          <Lock size={9} className="text-orange-500 flex-shrink-0" />
          <span className="text-[10px] font-semibold text-orange-600">
            Add ₹{remaining.toFixed(0)} more to unlock order
          </span>
          <span className="text-[9px] text-orange-400 font-medium">
            · ₹{totalPrice.toFixed(0)} / ₹{MIN_ORDER}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
