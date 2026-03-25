"use client";

import { useState } from "react";
import { useCart } from "./CartContext";
import { Plus, Minus, ChevronDown } from "lucide-react";
import Image from "next/image";

const RICE_TYPES = [
  { key: "withRice", label: "With Rice" },
  { key: "meatOnly", label: "Meat Only" },
];
const SIZES = [
  { key: "qtr", label: "Qtr" },
  { key: "half", label: "Half" },
  { key: "full", label: "Full" },
];

export default function ProductCard({ product }) {
  const { cart, addToCart, updateQuantity } = useCart();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedRice, setSelectedRice] = useState("withRice");
  const [selectedSize, setSelectedSize] = useState("qtr");

  const hasPortions = !!product.portionSlab;

  // Starting price for display
  const displayPrice = hasPortions
    ? product.portionSlab?.withRice?.qtr ?? product.price
    : product.price;

  // Selected portion price in picker
  const pickerPrice = hasPortions
    ? (product.portionSlab?.[selectedRice]?.[selectedSize] ?? null)
    : null;

  // Check if any cart items match this product (for flat) or any portion (for portion products)
  const flatCartItem = !hasPortions
    ? cart.find((item) => item.cartKey === product.id)
    : null;
  const portionCartItems = hasPortions
    ? cart.filter((item) => item.id === product.id)
    : [];

  const totalPortionQty = portionCartItems.reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  const handleAddPortion = () => {
    if (!pickerPrice) return;
    addToCart(product, selectedSize, selectedRice, pickerPrice);
    setPickerOpen(false);
  };

  // Determine available rice types (some items may only have one side)
  const availableRiceTypes = RICE_TYPES.filter(
    (rt) => product.portionSlab?.[rt.key]
  );

  const stockCount = product.stockCount !== undefined ? product.stockCount : 999;
  const isOutOfStock = stockCount <= 0;

  return (
    <div className={`bg-white rounded-xl border border-purple-50 overflow-hidden flex flex-col card-shadow relative ${isOutOfStock ? 'opacity-80' : ''}`}>
      {/* Image */}
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
            <span className="text-4xl select-none">{product.emoji || "🍽️"}</span>
          </div>
        )}

        {/* Cart badge */}
        {!isOutOfStock && (flatCartItem || totalPortionQty > 0) && (
          <span
            className="absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 h-4 rounded-full flex items-center justify-center"
            style={{ background: "#7c3aed", color: "white" }}
          >
            {flatCartItem ? flatCartItem.quantity : totalPortionQty}
          </span>
        )}

        {/* Out of Stock badge */}
        {isOutOfStock && (
          <div className="absolute top-2 left-2 bg-red-500/90 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
            Sold Out
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col flex-1">
        {/* Badges */}
        <div className="flex items-center gap-1 mb-0.5">
          {product.isVeg && (
            <span className="text-[9px] bg-green-100 text-green-700 px-1 rounded font-bold">VEG</span>
          )}
          {product.isBestseller && (
            <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1 rounded font-bold">⭐ BEST</span>
          )}
          {product.spiceLevel && product.spiceLevel !== "None" && (
            <span className="text-[9px] text-gray-400 font-medium">{product.spiceLevel}</span>
          )}
        </div>

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

        {/* Price row + Add */}
        <div className="flex items-center justify-between mt-auto">
          <div>
            {product.priceNote ? (
              <span className="text-[11px] font-semibold text-amber-600">{product.priceNote}</span>
            ) : hasPortions ? (
              <div>
                <span className="text-[10px] text-gray-400">from </span>
                <span className="text-[13px] font-black text-gray-900">₹{displayPrice}</span>
              </div>
            ) : (
              <span className="text-[13px] font-black text-gray-900">₹{product.price}</span>
            )}
          </div>

          {/* Add button / stepper */}
          {isOutOfStock ? (
            <div className="bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-gray-200">
              Not Available
            </div>
          ) : hasPortions ? (
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-0.5 border-2 border-purple-500 rounded-lg text-purple-600 px-2 h-7 text-[11px] font-bold active:bg-purple-50 transition-colors"
            >
              <Plus size={12} strokeWidth={3} />
              {totalPortionQty > 0 && (
                <span className="ml-0.5">{totalPortionQty}</span>
              )}
            </button>
          ) : flatCartItem ? (
            <div className="flex items-center border border-purple-500 rounded-lg overflow-hidden">
              <button
                onClick={() => updateQuantity(product.id, -1)}
                className="w-7 h-7 flex items-center justify-center text-purple-600 active:bg-purple-50 transition-colors"
              >
                <Minus size={12} strokeWidth={3} />
              </button>
              <span className="font-bold text-xs text-purple-700 w-5 text-center select-none">
                {flatCartItem.quantity}
              </span>
              <button
                onClick={() => {
                  if (flatCartItem.quantity < stockCount) updateQuantity(product.id, 1);
                }}
                disabled={flatCartItem.quantity >= stockCount}
                className="w-7 h-7 flex items-center justify-center bg-purple-600 text-white active:bg-purple-700 transition-colors disabled:opacity-50 disabled:bg-gray-400"
              >
                <Plus size={12} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addToCart(product)}
              className="w-7 h-7 flex items-center justify-center border-2 border-purple-500 rounded-lg text-purple-600 active:bg-purple-50 transition-colors"
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {/* ── Portion Picker Overlay ── */}
      {pickerOpen && hasPortions && (
        <div
          className="absolute inset-0 bg-white z-10 flex flex-col p-3"
          style={{ borderRadius: "inherit" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-700 truncate pr-2">{product.name}</span>
            <button
              onClick={() => setPickerOpen(false)}
              className="text-gray-400 hover:text-gray-700 flex-shrink-0"
            >
              <ChevronDown size={16} />
            </button>
          </div>

          {/* Rice type */}
          {availableRiceTypes.length > 1 && (
            <div className="mb-2">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Type</p>
              <div className="flex gap-1">
                {availableRiceTypes.map((rt) => (
                  <button
                    key={rt.key}
                    onClick={() => setSelectedRice(rt.key)}
                    className={`flex-1 text-[10px] font-bold py-1 rounded-lg transition-colors ${
                      selectedRice === rt.key
                        ? "bg-purple-600 text-white"
                        : "bg-purple-50 text-purple-600"
                    }`}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          <div className="mb-3">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Size</p>
            <div className="flex gap-1">
              {SIZES.map((sz) => {
                const price = product.portionSlab?.[selectedRice]?.[sz.key];
                if (!price) return null;
                return (
                  <button
                    key={sz.key}
                    onClick={() => setSelectedSize(sz.key)}
                    className={`flex-1 py-1 rounded-lg transition-colors text-center ${
                      selectedSize === sz.key
                        ? "bg-purple-600 text-white"
                        : "bg-purple-50 text-purple-600"
                    }`}
                  >
                    <div className="text-[10px] font-bold">{sz.label}</div>
                    <div className="text-[9px]">₹{price}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Confirm */}
          <button
            onClick={handleAddPortion}
            disabled={!pickerPrice}
            className="w-full bg-purple-600 text-white text-[11px] font-bold py-2 rounded-lg mt-auto active:bg-purple-700 transition-colors disabled:opacity-40"
          >
            Add — ₹{pickerPrice ?? "—"}
          </button>
        </div>
      )}
    </div>
  );
}
