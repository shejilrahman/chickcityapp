"use client";

import { useCart } from "./CartContext";
import { Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const MIN_ORDER = 100;

export default function CartDrawer() {
  const { totalItems, totalPrice } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (totalItems > 0 && totalPrice < MIN_ORDER) {
      setVisible(true);
      // Auto-dismiss after 3 seconds
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [totalItems, totalPrice]);

  const remaining = Math.max(0, MIN_ORDER - totalPrice);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="hint"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-[68px] inset-x-0 z-40 flex justify-center px-6"
        >
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-full py-1.5 px-4 shadow-sm">
            <Lock size={9} className="text-orange-500 flex-shrink-0" />
            <span className="text-[10px] font-semibold text-orange-600 whitespace-nowrap">
              Add ₹{remaining.toFixed(0)} more to unlock order
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
