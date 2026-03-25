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

export default function ProductListItem({ product }) {
  const { cart, addToCart, updateQuantity } = useCart();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedRice, setSelectedRice] = useState("withRice");
  const [selectedSize, setSelectedSize] = useState("qtr");

  const hasPortions = !!product.portionSlab;

  const displayPrice = hasPortions
    ? product.portionSlab?.withRice?.qtr ?? product.price
    : product.price;

  const pickerPrice = hasPortions
    ? (product.portionSlab?.[selectedRice]?.[selectedSize] ?? null)
    : null;

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

  const availableRiceTypes = RICE_TYPES.filter(
    (rt) => product.portionSlab?.[rt.key]
  );

  return (
    <div className="bg-white flex flex-col px-4 py-3 border-b border-gray-100 active:bg-gray-50 transition-colors relative">
      <div className="flex items-center gap-3">
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
              <span className="text-2xl select-none">{product.emoji || "🍽️"}</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            {product.isVeg && (
              <span className="text-[9px] bg-green-100 text-green-700 px-1 rounded font-bold">VEG</span>
            )}
            {product.isBestseller && (
              <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1 rounded font-bold">⭐</span>
            )}
          </div>
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
          <div className="mt-0.5">
            {product.priceNote ? (
              <span className="text-[11px] font-semibold text-amber-600">{product.priceNote}</span>
            ) : hasPortions ? (
              <span className="text-[13px] font-black text-gray-900">
                <span className="text-[10px] font-normal text-gray-400">from </span>
                ₹{displayPrice}
              </span>
            ) : (
              <span className="text-[14px] font-black text-gray-900">₹{product.price}</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex-shrink-0">
          {hasPortions ? (
            <button
              onClick={() => setPickerOpen((prev) => !prev)}
              className="flex items-center gap-1 border-2 border-purple-500 rounded-xl text-purple-600 px-2.5 h-8 text-[11px] font-bold active:bg-purple-50 transition-colors"
            >
              <Plus size={13} strokeWidth={3} />
              {totalPortionQty > 0 && (
                <span>{totalPortionQty}</span>
              )}
            </button>
          ) : flatCartItem ? (
            <div className="flex items-center border border-purple-500 rounded-lg overflow-hidden">
              <button
                onClick={() => updateQuantity(product.id, -1)}
                className="w-8 h-8 flex items-center justify-center text-purple-600 active:bg-purple-50 transition-colors"
              >
                <Minus size={13} strokeWidth={3} />
              </button>
              <span className="font-bold text-sm text-purple-700 w-6 text-center select-none">
                {flatCartItem.quantity}
              </span>
              <button
                onClick={() => updateQuantity(product.id, 1)}
                className="w-8 h-8 flex items-center justify-center bg-green-500 text-white active:bg-green-600 transition-colors"
              >
                <Plus size={13} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addToCart(product)}
              className="w-8 h-8 flex items-center justify-center border-2 border-purple-500 rounded-lg text-purple-600 active:bg-purple-50 transition-colors"
            >
              <Plus size={16} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {/* ── Inline Portion Picker ── */}
      {pickerOpen && hasPortions && (
        <div className="mt-3 bg-purple-50 rounded-2xl p-3 border border-purple-100">
          {/* Rice type */}
          {availableRiceTypes.length > 1 && (
            <div className="mb-2">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Type</p>
              <div className="flex gap-1.5">
                {availableRiceTypes.map((rt) => (
                  <button
                    key={rt.key}
                    onClick={() => setSelectedRice(rt.key)}
                    className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-colors ${
                      selectedRice === rt.key
                        ? "bg-purple-600 text-white"
                        : "bg-white text-purple-600 border border-purple-200"
                    }`}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          <div className="mb-2">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Size</p>
            <div className="flex gap-1.5">
              {SIZES.map((sz) => {
                const price = product.portionSlab?.[selectedRice]?.[sz.key];
                if (!price) return null;
                return (
                  <button
                    key={sz.key}
                    onClick={() => setSelectedSize(sz.key)}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-colors ${
                      selectedSize === sz.key
                        ? "bg-purple-600 text-white"
                        : "bg-white text-purple-600 border border-purple-200"
                    }`}
                  >
                    <div className="text-[11px] font-bold">{sz.label}</div>
                    <div className="text-[9px]">₹{price}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Confirm row */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddPortion}
              disabled={!pickerPrice}
              className="flex-1 bg-purple-600 text-white text-[12px] font-bold py-2 rounded-xl active:bg-purple-700 transition-colors disabled:opacity-40"
            >
              Add — ₹{pickerPrice ?? "—"}
            </button>
            <button
              onClick={() => setPickerOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400"
            >
              <ChevronDown size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
