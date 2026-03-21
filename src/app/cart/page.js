"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/components/CartContext";
import { generateWhatsAppMessage } from "@/lib/whatsapp";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Plus, Minus, Send, MapPin, Loader2, ShoppingBag, Lock, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { WEIGHT_SLABS, getSlabPrice, formatGrams } from "@/lib/weight-slabs";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

const MIN_ORDER = 300;

export default function CartPage() {
  const { cart, updateQuantity, totalItems, totalPrice, clearCart, getEffectivePrice } = useCart();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [landmark, setLandmark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const savedDetails = localStorage.getItem("grocery-customer");
    if (savedDetails) {
      try {
        const { savedName, savedPhone, savedLocation, savedLandmark } = JSON.parse(savedDetails);
        if (savedName) setName(savedName);
        if (savedPhone) setPhone(savedPhone);
        if (savedLocation) setLocation(savedLocation);
        if (savedLandmark) setLandmark(savedLandmark);
      } catch (e) {
        console.error("Failed to parse customer details", e);
      }
    }
    setIsHydrated(true);
  }, []);

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!name || !phone || !location || cart.length === 0) return;
    setIsSubmitting(true);
    try {
      localStorage.setItem("grocery-customer", JSON.stringify({ savedName: name, savedPhone: phone, savedLocation: location, savedLandmark: landmark }));
      const pastItems = JSON.parse(localStorage.getItem("grocery-history") || "[]");
      localStorage.setItem("grocery-history", JSON.stringify(Array.from(new Set([...pastItems, ...cart.map(i => i.id)]))));

      const docRef = await addDoc(collection(db, "orders"), {
        customerName: name || "",
        customerPhone: phone || "",
        customerLocation: location || "",
        customerLandmark: landmark || "",
        items: cart.map((item) => {
          const slab = item.weightSlab ? WEIGHT_SLABS[item.weightSlab] : null;
          const effectivePrice = slab && item.selectedGrams
            ? getSlabPrice(item.price, item.selectedGrams, slab.baseUnit)
            : item.price;
          
          return {
            id: item.id || "",
            name: item.name || "Unknown Item",
            price: Number(effectivePrice) || 0,
            quantity: item.weightSlab ? 1 : (Number(item.quantity) || 1),
            unit: (item.weightSlab && item.selectedGrams) 
              ? formatGrams(item.selectedGrams) 
              : (item.unit || "Portion"),
            ...(item.weightSlab ? { weightSlab: item.weightSlab, selectedGrams: item.selectedGrams } : {}),
          };
        }),
        total: Number(totalPrice) || 0,
        status: "pending",
        timestamp: serverTimestamp(),
      });

      const pastOrders = JSON.parse(localStorage.getItem("grocery-orders") || "[]");
      localStorage.setItem("grocery-orders", JSON.stringify([...pastOrders, docRef.id]));
      clearCart();
      router.push("/orders");
      const url = generateWhatsAppMessage(cart, totalPrice, name, phone, location, landmark);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Order failed:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#f0f7f0] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
          <ShoppingBag size={38} className="text-gray-300" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">Cart is empty</h2>
        <p className="text-gray-400 mb-8 max-w-xs text-sm">
          Add some delicious items to your cart and come back here to checkout.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-gray-900 text-white px-8 py-3.5 rounded-2xl font-bold text-[15px] active:scale-[0.97] transition-transform"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f7f0] pb-10">
      {/* Header */}
      <header className="glass border-b border-gray-100 px-4 py-4 sticky top-0 z-40 flex items-center gap-3 safe-top">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center active:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-[18px] font-black text-gray-900">Your Cart</h1>
        </div>
        <div className="bg-green-100 text-green-800 text-sm font-bold px-3 py-1.5 rounded-full">
          {totalItems} item{totalItems !== 1 ? "s" : ""}
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Cart Items */}
        <div className="space-y-2.5">
          {cart.map((item) => {
            const slab = item.weightSlab ? WEIGHT_SLABS[item.weightSlab] : null;
            const effectivePrice = slab && item.selectedGrams
              ? getSlabPrice(item.price, item.selectedGrams, slab.baseUnit)
              : item.price;
            const lineTotal = effectivePrice * (slab ? 1 : item.quantity);
            const unitLabel = slab ? formatGrams(item.selectedGrams) : `₹${item.price} ${item.unit ? "/ " + item.unit : ""}`;

            return (
            <div key={item.id} className="bg-white rounded-2xl p-3.5 flex items-center gap-3 shadow-sm border border-gray-100">
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 relative border border-gray-100">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl">{item.emoji || "📦"}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[14px] text-gray-900 truncate">{item.name}</h3>
                <p className="text-xs text-gray-400">{unitLabel}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center bg-gray-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 active:bg-gray-200 transition-colors"
                    >
                      {slab
                        ? <Minus size={14} />
                        : (item.quantity === 1 ? <Trash2 size={14} className="text-red-500" /> : <Minus size={14} />)
                      }
                    </button>
                    <span className="w-auto px-2 text-center font-bold text-sm select-none text-gray-900">
                      {slab ? formatGrams(item.selectedGrams) : item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={slab && item.selectedGrams >= slab.max}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 active:bg-gray-200 transition-colors disabled:opacity-40"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Line Total */}
              <div className="text-right flex-shrink-0">
                <p className="font-black text-[17px] text-gray-900">₹{lineTotal.toFixed(2)}</p>
                {slab && <p className="text-[10px] text-gray-400">@ ₹{item.price} (Full)</p>}
              </div>
            </div>
          );
          })}
        </div>

        {/* Order Total */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Subtotal</span>
            <span className="font-bold text-gray-900">₹{totalPrice}</span>
          </div>
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-gray-500 font-medium">Delivery</span>
            <span className="font-bold text-green-600 text-sm">Free</span>
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center">
            <span className="text-lg font-black text-gray-900">Total</span>
            <span className="text-2xl font-black text-gray-900">₹{totalPrice}</span>
          </div>
        </div>

        {/* Minimum order banner */}
        {totalPrice < MIN_ORDER && (
          <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3.5">
            <AlertTriangle size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-orange-800 text-sm">Minimum order of ₹{MIN_ORDER} required</p>
              <p className="text-orange-600 text-xs mt-0.5">
                Add ₹{(MIN_ORDER - totalPrice).toFixed(0)} more to place your order.
              </p>
            </div>
          </div>
        )}

        {/* Checkout Form */}
        {isHydrated ? (
          <form onSubmit={handleOrder} className="space-y-3 pb-6">
            <h2 className="text-[16px] font-black text-gray-900 mt-2 mb-1">Delivery Details</h2>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text" required placeholder="Your name"
                value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-[15px] text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
              <input
                type="tel" required placeholder="10-digit mobile number"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-[15px] text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Delivery Address</label>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 active:bg-emerald-100 transition-colors"
                >
                  <MapPin size={11} />
                  Pin on Map
                </button>
              </div>
              <textarea
                required rows="2" placeholder="Full address or tap 'Pin on Map'"
                value={location} onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-[15px] text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Landmark <span className="normal-case text-gray-400 font-normal">(Optional)</span></label>
              <input
                type="text" placeholder="e.g. Near the main temple"
                value={landmark} onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-[15px] text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !name || !phone || !location || totalPrice < MIN_ORDER}
              className="w-full bg-gray-900 text-white rounded-2xl py-4.5 font-black text-[16px] flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20 mt-4"
              style={{ paddingTop: "1.125rem", paddingBottom: "1.125rem" }}
            >
              {isSubmitting ? (
                <><Loader2 size={20} className="animate-spin" /> Processing...</>
              ) : totalPrice < MIN_ORDER ? (
                <><Lock size={18} /> Min. ₹{MIN_ORDER} Required</>
              ) : (
                <><Send size={18} /> Order via WhatsApp</>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 pb-4">
              You&apos;ll be redirected to WhatsApp to confirm your order.
            </p>
          </form>
        ) : (
          <div className="bg-white rounded-2xl p-6 flex items-center justify-center animate-pulse h-48">
            <Loader2 size={28} className="text-gray-200 animate-spin" />
          </div>
        )}
      </div>

      {/* Map Picker Overlay */}
      {showMap && (
        <MapPicker
          onConfirm={(addr) => {
            setLocation(addr);
            setShowMap(false);
          }}
          onCancel={() => setShowMap(false)}
        />
      )}
    </div>
  );
}
