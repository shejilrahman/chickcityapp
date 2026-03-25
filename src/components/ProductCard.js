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
  { key: "qtr",  label: "Qtr"  },
  { key: "half", label: "Half" },
  { key: "full", label: "Full" },
];

// Lightweight css-in-js animation injected once
const ANIM_STYLE = `
@keyframes card-pop {
  0%   { transform: scale(1); }
  40%  { transform: scale(0.93); }
  70%  { transform: scale(1.06); }
  100% { transform: scale(1); }
}
@keyframes badge-bounce {
  0%,100% { transform: scale(1); }
  50%      { transform: scale(1.4); }
}
.card-pop-anim  { animation: card-pop 0.32s cubic-bezier(.36,.07,.19,.97) both; }
.badge-bounce   { animation: badge-bounce 0.4s ease; }
`;

let styleInjected = false;
function ensureStyle() {
  if (styleInjected || typeof document === "undefined") return;
  const s = document.createElement("style");
  s.textContent = ANIM_STYLE;
  document.head.appendChild(s);
  styleInjected = true;
}

export default function ProductCard({ product }) {
  const { cart, addToCart, updateQuantity } = useCart();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedRice, setSelectedRice] = useState("withRice");
  const [selectedSize, setSelectedSize] = useState("qtr");
  const [popping, setPopping] = useState(false);

  ensureStyle();

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
  const totalPortionQty = portionCartItems.reduce((acc, item) => acc + item.quantity, 0);

  const stockCount = product.stockCount !== undefined ? product.stockCount : 999;
  const isOutOfStock = stockCount <= 0;
  const inCart = flatCartItem || totalPortionQty > 0;

  const triggerPop = () => {
    setPopping(false);
    requestAnimationFrame(() => { requestAnimationFrame(() => setPopping(true)); });
    setTimeout(() => setPopping(false), 350);
  };

  const handleAddPortion = () => {
    if (!pickerPrice) return;
    addToCart(product, selectedSize, selectedRice, pickerPrice);
    triggerPop();
    setPickerOpen(false);
  };

  const availableRiceTypes = RICE_TYPES.filter(rt => product.portionSlab?.[rt.key]);

  return (
    <div
      className={`relative flex flex-col overflow-hidden ${popping ? "card-pop-anim" : ""} ${isOutOfStock ? "opacity-70" : ""}`}
      style={{
        background: "#ffffff",
        borderRadius: "20px",
        boxShadow: inCart && !isOutOfStock
          ? "0 4px 20px rgba(201,162,39,0.22), 0 1px 4px rgba(0,0,0,0.06)"
          : "0 2px 10px rgba(0,0,0,0.07)",
        border: inCart && !isOutOfStock ? "1.5px solid rgba(201,162,39,0.5)" : "1.5px solid rgba(0,0,0,0.04)",
        transition: "box-shadow 0.3s, border-color 0.3s",
        willChange: "transform",
      }}
    >
      {/* ── Image ── */}
      <div className="p-2">
        <div
          className="relative w-full aspect-square overflow-hidden"
          style={{
            borderRadius: "16px",
            background: "linear-gradient(145deg, #fff8ee, #f5f0eb)",
          }}
        >
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 200px"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl select-none">{product.emoji || "🍽️"}</span>
            </div>
          )}

          {/* Cart qty badge */}
          {!isOutOfStock && inCart && (
            <span
              className={`absolute top-2 right-2 text-[10px] font-black px-1.5 h-[18px] rounded-full flex items-center justify-center shadow-sm ${popping ? "badge-bounce" : ""}`}
              style={{ background: "#c9a227", color: "#fff", minWidth: "18px" }}
            >
              {flatCartItem ? flatCartItem.quantity : totalPortionQty}
            </span>
          )}

          {/* Best seller ribbon */}
          {product.isBestseller && !isOutOfStock && (
            <div
              className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase rounded-full"
              style={{ background: "linear-gradient(90deg,#c9a227,#f5d171)", color: "#fff" }}
            >
              ⭐ BEST
            </div>
          )}

          {/* Sold out overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)", borderRadius: "16px" }}>
              <span className="text-white font-black text-[11px] uppercase tracking-widest px-3 py-1 rounded-full" style={{ background:"rgba(0,0,0,0.5)" }}>
                Sold Out
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Info ── */}
      <div className="p-3 flex flex-col flex-1">
        {/* Labels */}
        <div className="flex items-center gap-1 mb-1">
          {product.isVeg && (
            <span className="text-[8.5px] bg-green-100 text-green-700 px-1.5 rounded-full font-black">VEG</span>
          )}
          {product.spiceLevel && product.spiceLevel !== "None" && (
            <span className="text-[8.5px] text-stone-400 font-semibold">{product.spiceLevel}</span>
          )}
        </div>

        {/* Name */}
        <h3
          className="text-[13px] font-bold text-[#0d1654] leading-snug flex-1 mb-2.5"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.name}
        </h3>

        {/* Price + Add row */}
        <div className="flex items-center justify-between mt-auto gap-1">
          {/* Price */}
          <div>
            {product.priceNote ? (
              <span className="text-[11px] font-bold text-amber-600">{product.priceNote}</span>
            ) : hasPortions ? (
              <div className="leading-none">
                <span className="text-[9px] text-stone-400">from </span>
                <span className="text-[14px] font-black text-[#0d1654]">₹{displayPrice}</span>
              </div>
            ) : (
              <span className="text-[14px] font-black text-[#0d1654]">₹{product.price}</span>
            )}
          </div>

          {/* Controls */}
          {isOutOfStock ? (
            <div className="text-[9px] font-bold text-stone-400 px-2 py-1 bg-stone-100 rounded-lg">N/A</div>
          ) : hasPortions ? (
            // Portions → open picker
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-0.5 px-2 h-8 rounded-xl text-[11px] font-black transition-all active:scale-95"
              style={{
                background: totalPortionQty > 0 ? "#c9a227" : "transparent",
                border: `2px solid ${totalPortionQty > 0 ? "#c9a227" : "#c9a227"}`,
                color: totalPortionQty > 0 ? "#fff" : "#c9a227",
              }}
            >
              <Plus size={12} strokeWidth={3} />
              {totalPortionQty > 0 && <span className="ml-0.5">{totalPortionQty}</span>}
            </button>
          ) : flatCartItem ? (
            // Flat item stepper
            <div className="flex items-center overflow-hidden rounded-xl" style={{ border:"2px solid #c9a227" }}>
              <button
                onClick={() => { updateQuantity(product.id, -1); triggerPop(); }}
                className="w-8 h-8 flex items-center justify-center active:bg-amber-50 transition-colors"
                style={{ color:"#c9a227" }}
              >
                <Minus size={12} strokeWidth={3} />
              </button>
              <span className="font-black text-xs w-5 text-center" style={{ color:"#c9a227" }}>
                {flatCartItem.quantity}
              </span>
              <button
                onClick={() => {
                  if (flatCartItem.quantity < stockCount) { updateQuantity(product.id, 1); triggerPop(); }
                }}
                disabled={flatCartItem.quantity >= stockCount}
                className="w-8 h-8 flex items-center justify-center text-white active:opacity-80 transition-all disabled:opacity-40"
                style={{ background:"#c9a227" }}
              >
                <Plus size={12} strokeWidth={3} />
              </button>
            </div>
          ) : (
            // Plain add button
            <button
              onClick={() => { addToCart(product); triggerPop(); }}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-90"
              style={{ background:"#0d1654", color:"#fff", boxShadow:"0 2px 8px rgba(13,22,84,0.3)" }}
            >
              <Plus size={15} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {/* ── Portion Picker Overlay ── */}
      {pickerOpen && hasPortions && (
        <div
          className="absolute inset-0 z-10 flex flex-col p-3.5"
          style={{ background:"#fff", borderRadius:"20px" }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-black text-[#0d1654] truncate pr-2">{product.name}</span>
            <button onClick={() => setPickerOpen(false)} className="text-stone-400 active:text-stone-700">
              <ChevronDown size={18} />
            </button>
          </div>

          {availableRiceTypes.length > 1 && (
            <div className="mb-2.5">
              <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1.5">Type</p>
              <div className="flex gap-1.5">
                {availableRiceTypes.map(rt => (
                  <button
                    key={rt.key}
                    onClick={() => setSelectedRice(rt.key)}
                    className="flex-1 text-[10px] font-bold py-1.5 rounded-xl transition-all"
                    style={{
                      background: selectedRice === rt.key ? "#0d1654" : "#f5f0eb",
                      color: selectedRice === rt.key ? "#fff" : "#0d1654",
                    }}
                  >{rt.label}</button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-3">
            <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1.5">Size</p>
            <div className="flex gap-1.5">
              {SIZES.map(sz => {
                const price = product.portionSlab?.[selectedRice]?.[sz.key];
                if (!price) return null;
                return (
                  <button
                    key={sz.key}
                    onClick={() => setSelectedSize(sz.key)}
                    className="flex-1 py-1.5 rounded-xl transition-all text-center"
                    style={{
                      background: selectedSize === sz.key ? "#c9a227" : "#f5f0eb",
                      color: selectedSize === sz.key ? "#fff" : "#0d1654",
                    }}
                  >
                    <div className="text-[10px] font-black">{sz.label}</div>
                    <div className="text-[9px] font-semibold mt-0.5">₹{price}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleAddPortion}
            disabled={!pickerPrice}
            className="w-full text-white text-[12px] font-black py-2.5 rounded-xl mt-auto transition-all active:opacity-80 disabled:opacity-40"
            style={{ background:"linear-gradient(135deg,#0d1654,#1a2a80)", boxShadow:"0 3px 12px rgba(13,22,84,0.35)" }}
          >
            Add — ₹{pickerPrice ?? "—"}
          </button>
        </div>
      )}
    </div>
  );
}
