"use client";

import { useCart } from "./CartContext";
import { Plus, Minus } from "lucide-react";
import Image from "next/image";
import { WEIGHT_SLABS, getSlabPrice, formatGrams } from "@/lib/weight-slabs";

export default function ProductListItem({ product }) {
  const { cart, addToCart, updateQuantity } = useCart();
  const cartItem = cart.find((item) => item.id === product.id);

  // Slab product logic
  const slab = product.weightSlab ? WEIGHT_SLABS[product.weightSlab] : null;
  const selectedGrams = cartItem?.selectedGrams ?? 0;
  const effectivePrice = slab && selectedGrams
    ? getSlabPrice(product.price, selectedGrams, slab.baseUnit)
    : product.price;

  const unitLabel = slab
    ? (selectedGrams ? formatGrams(selectedGrams) : "Full Portion")
    : product.unit;

  return (
    <div className="bg-white flex items-center gap-3 px-4 py-3 border-b border-gray-100 active:bg-gray-50 transition-colors">

      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-xl flex-shrink-0 bg-gray-50 overflow-hidden relative border border-gray-100">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="56px"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-2xl select-none">{product.emoji || "📦"}</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-semibold text-gray-800 leading-snug"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.name}
        </p>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-gray-400 font-medium">{unitLabel}</span>
        </div>

        <div className="mt-0.5">
          <span className="text-[14px] font-black text-gray-900">
            {slab && selectedGrams
              ? `₹${effectivePrice.toFixed(2)}`
              : `₹${product.price}`}
          </span>
        </div>
      </div>

      {/* Add / qty control */}
      <div className="flex-shrink-0">
        {cartItem && slab ? (
          /* Slab product in cart */
          <div className="flex items-center border border-purple-500 rounded-lg overflow-hidden">
            <button
              onClick={() => { updateQuantity(product.id, -1); navigator.vibrate?.(10); }}
              className="w-8 h-8 flex items-center justify-center text-purple-600 active:bg-purple-50 transition-colors"
            >
              <Minus size={13} strokeWidth={3} />
            </button>
            <span className="font-bold text-[10px] text-purple-700 px-1 text-center select-none">
              {formatGrams(selectedGrams)}
            </span>
            <button
              onClick={() => { updateQuantity(product.id, 1); navigator.vibrate?.(10); }}
              disabled={selectedGrams >= slab.max}
              className="w-8 h-8 flex items-center justify-center bg-green-500 text-white active:bg-green-600 transition-colors disabled:opacity-40"
            >
              <Plus size={13} strokeWidth={3} />
            </button>
          </div>
        ) : cartItem && !slab ? (
          /* Regular product in cart */
          <div className="flex items-center border border-purple-500 rounded-lg overflow-hidden">
            <button
              onClick={() => { updateQuantity(product.id, -1); navigator.vibrate?.(10); }}
              className="w-8 h-8 flex items-center justify-center text-purple-600 active:bg-purple-50 transition-colors"
            >
              <Minus size={13} strokeWidth={3} />
            </button>
            <span className="font-bold text-sm text-purple-700 w-6 text-center select-none">
              {cartItem.quantity}
            </span>
            <button
              onClick={() => { updateQuantity(product.id, 1); navigator.vibrate?.(10); }}
              className="w-8 h-8 flex items-center justify-center bg-green-500 text-white active:bg-green-600 transition-colors"
            >
              <Plus size={13} strokeWidth={3} />
            </button>
          </div>
        ) : (
          /* Not in cart */
          <button
            onClick={() => { addToCart(product); navigator.vibrate?.(10); }}
            className="w-8 h-8 flex items-center justify-center border-2 border-purple-500 rounded-lg text-purple-600 active:bg-purple-50 transition-colors"
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        )}
      </div>
    </div>
  );
}
