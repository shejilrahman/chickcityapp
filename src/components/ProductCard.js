"use client";

import { useCart } from "./CartContext";
import { Plus, Minus } from "lucide-react";
import Image from "next/image";
import { WEIGHT_SLABS, getSlabPrice, formatGrams } from "@/lib/weight-slabs";

export default function ProductCard({ product }) {
  const { cart, addToCart, updateQuantity } = useCart();
  const cartItem = cart.find((item) => item.id === product.id);

  // Slab product logic
  const slab = product.weightSlab ? WEIGHT_SLABS[product.weightSlab] : null;
  const selectedGrams = cartItem?.selectedGrams ?? 0;
  const effectivePrice = slab && selectedGrams
    ? getSlabPrice(product.price, selectedGrams, slab.baseUnit)
    : product.price;

  const displayPrice = slab && selectedGrams
    ? `₹${effectivePrice.toFixed(2)}`
    : `₹${product.price}`;

  const unitLabel = slab
    ? (selectedGrams ? formatGrams(selectedGrams) : `Full Portion`)
    : product.unit;

  return (
    <div className="bg-white rounded-xl border border-purple-50 overflow-hidden flex flex-col card-shadow">
      {/* Image — 1:1 ratio */}
      <div className="relative w-full bg-gray-50" style={{ paddingBottom: "100%" }}>
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 50vw, 200px"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl select-none">{product.emoji || "📦"}</span>
          </div>
        )}

        {/* Cart badge */}
        {cartItem && (
            <span className="text-[10px] font-bold px-1.5 h-4 rounded-full flex items-center justify-center" style={{background:'#7c3aed', color:'white'}}>
            {slab ? formatGrams(selectedGrams) : cartItem.quantity}
            </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col flex-1">
        {/* Unit / weight pill */}
        <span className="text-[10px] text-gray-400 font-medium mb-0.5">{unitLabel}</span>

        {/* Name */}
        <h3
          className="text-[12.5px] font-semibold text-gray-800 leading-snug flex-1 mb-2"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.name}
        </h3>

        {/* Price row + Add button */}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[13px] font-black text-gray-900">{displayPrice}</span>

          {cartItem && slab ? (
            /* Slab product — in cart, show gram stepper */
            <div className="flex items-center border border-purple-500 rounded-lg overflow-hidden">
              <button
                onClick={() => { updateQuantity(product.id, -1); navigator.vibrate?.(10); }}
                className="w-7 h-7 flex items-center justify-center text-purple-600 active:bg-purple-50 transition-colors"
              >
                <Minus size={12} strokeWidth={3} />
              </button>
              <span className="font-bold text-[10px] text-purple-700 px-1 text-center select-none">
                {formatGrams(selectedGrams)}
              </span>
              <button
                onClick={() => { updateQuantity(product.id, 1); navigator.vibrate?.(10); }}
                disabled={selectedGrams >= slab.max}
                className="w-7 h-7 flex items-center justify-center bg-purple-600 text-white active:bg-purple-700 transition-colors disabled:opacity-40"
              >
                <Plus size={12} strokeWidth={3} />
              </button>
            </div>
          ) : cartItem && !slab ? (
            /* Regular product — in cart */
            <div className="flex items-center border border-purple-500 rounded-lg overflow-hidden">
              <button
                onClick={() => { updateQuantity(product.id, -1); navigator.vibrate?.(10); }}
                className="w-7 h-7 flex items-center justify-center text-purple-600 active:bg-purple-50 transition-colors"
              >
                <Minus size={12} strokeWidth={3} />
              </button>
              <span className="font-bold text-xs text-purple-700 w-5 text-center select-none">
                {cartItem.quantity}
              </span>
              <button
                onClick={() => { updateQuantity(product.id, 1); navigator.vibrate?.(10); }}
                className="w-7 h-7 flex items-center justify-center bg-purple-600 text-white active:bg-purple-700 transition-colors"
              >
                <Plus size={12} strokeWidth={3} />
              </button>
            </div>
          ) : (
            /* Not in cart */
            <button
              onClick={() => { addToCart(product); navigator.vibrate?.(10); }}
              className="w-7 h-7 flex items-center justify-center border-2 border-purple-500 rounded-lg text-purple-600 active:bg-purple-50 transition-colors"
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
