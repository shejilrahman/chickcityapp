"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/components/CartContext";
import { generateWhatsAppMessage } from "@/lib/whatsapp";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Plus, Minus, Send, MapPin, Loader2, ShoppingBag, Lock, AlertTriangle, QrCode, Banknote } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

const MIN_ORDER = 100;

const PORTION_LABELS = { qtr: "Qtr", half: "Half", full: "Full" };
const RICE_LABELS = { withRice: "With Rice", meatOnly: "Meat Only" };

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
  const [paymentMethod, setPaymentMethod] = useState("upi"); // "whatsapp" | "upi"

  useEffect(() => {
    const savedDetails = localStorage.getItem("restaurant-customer");
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
      localStorage.setItem("restaurant-customer", JSON.stringify({ savedName: name, savedPhone: phone, savedLocation: location, savedLandmark: landmark }));
      const pastItems = JSON.parse(localStorage.getItem("restaurant-history") || "[]");
      localStorage.setItem("restaurant-history", JSON.stringify(Array.from(new Set([...pastItems, ...cart.map(i => i.id)]))));

      // Prepare payload for backend
      const orderPayload = {
        name,
        phone,
        location,
        landmark,
        total: totalPrice,
        paymentMethod,
        cart: cart.map((item) => {
          const effectivePrice = item.portionPrice ?? item.price;
          const portionLabel = item.portion
            ? `${PORTION_LABELS[item.portion] ?? item.portion} · ${RICE_LABELS[item.riceType] ?? item.riceType}`
            : (item.unit || "Portion");

          return {
            id: item.id || "",
            name: item.name || "Unknown Item",
            price: Number(effectivePrice) || 0,
            quantity: Number(item.quantity) || 1,
            unit: portionLabel,
            ...(item.portion ? { portion: item.portion, riceType: item.riceType } : {}),
          };
        })
      };

      // Call secure transaction API
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to place order.");
      }

      const pastOrders = JSON.parse(localStorage.getItem("restaurant-orders") || "[]");
      localStorage.setItem("restaurant-orders", JSON.stringify([...pastOrders, data.orderId]));

      // Build items for WhatsApp using cartKey-aware structure
      const waItems = cart.map((item) => ({
        name: item.name,
        price: item.portionPrice ?? item.price,
        quantity: item.quantity,
        unit: item.portion
          ? `${PORTION_LABELS[item.portion] ?? item.portion} · ${RICE_LABELS[item.riceType] ?? item.riceType}`
          : (item.unit || ""),
      }));

      if (paymentMethod === "upi") {
        const upiId = process.env.NEXT_PUBLIC_UPI_ID || "8089551181@ybl";
        const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(process.env.NEXT_PUBLIC_SHOP_NAME || "Noor al Mandi")}&am=${totalPrice}&cu=INR&tn=${encodeURIComponent(`Order #${data.orderId.slice(-6)}`)}`;
        window.location.href = upiUrl;
        
        // Also send WhatsApp after a brief delay so they have the confirmation text
        setTimeout(() => {
          const url = generateWhatsAppMessage(waItems, totalPrice, name, phone, location, landmark, "Paid via UPI");
          window.open(url, "_blank");
          clearCart();
          router.push("/orders");
        }, 3000);
      } else {
        clearCart();
        router.push("/orders");
        const url = generateWhatsAppMessage(waItems, totalPrice, name, phone, location, landmark);
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Order failed:", error);
      alert(error.message || "Failed to place order. Please try again.");
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
            const effectivePrice = item.portionPrice ?? item.price;
            const lineTotal = effectivePrice * item.quantity;
            const portionLabel = item.portion
              ? `${PORTION_LABELS[item.portion] ?? item.portion} · ${RICE_LABELS[item.riceType] ?? item.riceType}`
              : (item.unit ? `₹${item.price} / ${item.unit}` : "");

            return (
              <div key={item.cartKey} className="bg-white rounded-2xl p-3.5 flex items-center gap-3 shadow-sm border border-gray-100">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 relative border border-gray-100">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl">{item.emoji || "🍽️"}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[14px] text-gray-900 truncate">{item.name}</h3>
                  {portionLabel && <p className="text-xs text-gray-400">{portionLabel}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center bg-gray-100 rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.cartKey, -1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 active:bg-gray-200 transition-colors"
                      >
                        {item.quantity === 1 ? <Trash2 size={14} className="text-red-500" /> : <Minus size={14} />}
                      </button>
                      <span className="w-auto px-2 text-center font-bold text-sm select-none text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartKey, 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 active:bg-gray-200 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Line Total */}
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-[17px] text-gray-900">₹{lineTotal.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-400">@ ₹{effectivePrice}</p>
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

            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("upi")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${paymentMethod === "upi" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-100 bg-white text-gray-500"}`}
                >
                  <QrCode size={22} className="mb-1 text-blue-500" />
                  <span className="text-[13px] font-bold mt-1">UPI Pay</span>
                  <span className="text-[10px] opacity-70">Pay Instantly</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("whatsapp")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${paymentMethod === "whatsapp" ? "border-green-600 bg-green-50 text-green-700" : "border-gray-100 bg-white text-gray-500"}`}
                >
                  <Banknote size={22} className="mb-1 text-green-600" />
                  <span className="text-[13px] font-bold mt-1">Pay on Delivery</span>
                  <span className="text-[10px] opacity-70">Cash / UPI</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !name || !phone || !location || totalPrice < MIN_ORDER}
              className={`w-full text-white rounded-2xl font-black text-[16px] flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-4 ${paymentMethod === 'upi' ? 'bg-blue-600 shadow-blue-600/20' : 'bg-gray-900 shadow-gray-900/20'}`}
              style={{ paddingTop: "1.125rem", paddingBottom: "1.125rem" }}
            >
              {isSubmitting ? (
                <><Loader2 size={20} className="animate-spin" /> Processing...</>
              ) : totalPrice < MIN_ORDER ? (
                <><Lock size={18} /> Min. ₹{MIN_ORDER} Required</>
              ) : paymentMethod === 'upi' ? (
                <><QrCode size={18} /> Pay ₹{totalPrice} with UPI</>
              ) : (
                <><Banknote size={18} /> Order as Pay on Delivery</>
              )}
            </button>
            
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5 mt-2">
              <Send size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                We use WhatsApp for our order system! After {paymentMethod === 'upi' ? 'paying' : 'submitting'}, you&apos;ll be securely redirected to WhatsApp where your order ticket will be generated automatically.
              </p>
            </div>
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
