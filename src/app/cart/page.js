"use client";

import { useState, useEffect, useMemo } from "react";
import { useCart } from "@/components/CartContext";
import { 
  ArrowLeft, Trash2, Plus, Minus, MapPin, Loader2, 
  ShoppingBag, Lock, AlertTriangle, QrCode, Banknote, 
  CheckCircle2, ChevronRight, Info 
} from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

const MIN_ORDER = 100;
const DELIVERY_FEE = 0; // Free delivery for now
const PLATFORM_FEE = 9; // Adding a small platform fee for professional feel

const PORTION_LABELS = { qtr: "Qtr", half: "Half", full: "Full" };
const RICE_LABELS = { withRice: "With Rice", meatOnly: "Meat Only" };

export default function CartPage() {
  const { cart, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
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

  const finalTotal = useMemo(() => {
    return totalPrice + (totalPrice > 0 ? PLATFORM_FEE : 0) + DELIVERY_FEE;
  }, [totalPrice]);

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!name || !phone || !location || cart.length === 0) return;
    setIsSubmitting(true);
    try {
      localStorage.setItem("restaurant-customer", JSON.stringify({ 
        savedName: name, savedPhone: phone, savedLocation: location, savedLandmark: landmark 
      }));
      
      const orderPayload = {
        name,
        phone,
        location,
        landmark,
        total: finalTotal,
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

      if (paymentMethod === "upi") {
        const upiId = process.env.NEXT_PUBLIC_UPI_ID || "8089551181@ybl";
        const shopName = process.env.NEXT_PUBLIC_SHOP_NAME || "Noor al Mandi";
        const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${finalTotal}&cu=INR&tn=${encodeURIComponent(`Order #${data.orderId.slice(-6)}`)}`;
        
        clearCart();
        window.location.href = upiUrl;
        
        setTimeout(() => {
          router.push("/orders");
        }, 1500);
      } else {
        clearCart();
        router.push("/orders");
      }
    } catch (error) {
      console.error("Order failed:", error);
      alert(error.message || "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#c9a227] animate-spin" />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 text-center">
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-[#fef8e7] rounded-full flex items-center justify-center">
            <ShoppingBag size={56} className="text-[#c9a227] opacity-40" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-white p-3 rounded-2xl shadow-xl border border-gray-50">
            <span className="text-2xl">🥘</span>
          </div>
        </div>
        <h2 className="text-2xl font-black text-[#070e38] mb-3">Your cart is empty</h2>
        <p className="text-gray-500 mb-10 max-w-[280px] text-sm leading-relaxed">
          Good food is always just a few clicks away! Let&apos;s find something delicious for you.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-[#070e38] text-white px-10 py-4 rounded-2xl font-black text-[15px] shadow-2xl shadow-blue-900/20 active:scale-[0.98] transition-all"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f0eb] pb-32">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-4 safe-top shadow-sm">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 border border-gray-100 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-[#070e38]" />
        </button>
        <div className="flex-1">
          <h1 className="text-[17px] font-black text-[#070e38]">Checkout</h1>
          <p className="text-[11px] font-bold text-[#c9a227] uppercase tracking-wider">
            {totalItems} item{totalItems !== 1 ? "s" : ""} · Total ₹{finalTotal}
          </p>
        </div>
      </header>

      <div className="px-4 pt-20 space-y-5">
        
        {/* Delivery Details Section */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-black/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#fef8e7] rounded-2xl flex items-center justify-center text-[#c9a227]">
                <MapPin size={20} />
              </div>
              <h2 className="font-black text-[16px] text-[#070e38]">Delivery Address</h2>
            </div>
            <button
              onClick={() => setShowMap(true)}
              className="text-[12px] font-black text-[#c9a227] bg-[#fef8e7] px-3 py-1.5 rounded-xl border border-[#c9a227]/10 active:scale-95 transition-all"
            >
              Pin on Map
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="text" required placeholder="Full Name"
                value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] text-[#070e38] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a227]/20 focus:bg-white transition-all"
              />
            </div>
            <div>
              <input
                type="tel" required placeholder="Phone Number"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] text-[#070e38] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a227]/20 focus:bg-white transition-all"
              />
            </div>
            <div>
              <textarea
                required rows="2" placeholder="Full Address / Building Name"
                value={location} onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] text-[#070e38] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a227]/20 focus:bg-white transition-all resize-none"
              />
            </div>
            <div>
              <input
                type="text" placeholder="Landmark (Optional)"
                value={landmark} onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] text-[#070e38] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a227]/20 focus:bg-white transition-all"
              />
            </div>
          </div>
        </section>

        {/* Cart Items */}
        <section className="bg-white rounded-3xl overflow-hidden shadow-sm border border-black/5">
          <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/30">
            <h2 className="font-black text-[15px] text-[#070e38] flex items-center gap-2">
              <ShoppingBag size={18} />
              Review Items
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {cart.map((item) => {
              const effectivePrice = item.portionPrice ?? item.price;
              const lineTotal = effectivePrice * item.quantity;
              const portionLabel = item.portion
                ? `${PORTION_LABELS[item.portion] ?? item.portion} · ${RICE_LABELS[item.riceType] ?? item.riceType}`
                : (item.unit || "");

              return (
                <div key={item.cartKey} className="p-4 flex items-start gap-4">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 relative border border-gray-100">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {item.emoji || "🍛"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[14px] text-[#070e38]">{item.name}</h3>
                    {portionLabel && <p className="text-[11px] text-gray-400 font-medium">{portionLabel}</p>}
                    <p className="font-black text-[14px] text-[#070e38] mt-1">₹{lineTotal}</p>
                  </div>
                  <div className="flex items-center border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => updateQuantity(item.cartKey, -1)}
                      className="w-8 h-8 flex items-center justify-center text-[#c9a227] hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      {item.quantity === 1 ? <Trash2 size={14} className="text-red-500" /> : <Minus size={14} />}
                    </button>
                    <span className="w-6 text-center font-bold text-[13px] text-[#070e38]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.cartKey, 1)}
                      className="w-8 h-8 flex items-center justify-center text-[#c9a227] hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bill Details */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-black/5">
          <h2 className="font-black text-[15px] text-[#070e38] mb-4">Bill Details</h2>
          <div className="space-y-3 text-[14px]">
            <div className="flex justify-between text-gray-500">
              <span className="flex items-center gap-1.5">Item Total</span>
              <span className="font-bold text-[#070e38]">₹{totalPrice}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span className="flex items-center gap-1.5">Delivery Fee <Info size={13} className="opacity-40" /></span>
              <span className="font-black text-green-600">FREE</span>
            </div>
            {PLATFORM_FEE > 0 && (
              <div className="flex justify-between text-gray-500">
                <span className="flex items-center gap-1.5">Platform Fee</span>
                <span className="font-bold text-[#070e38]">₹{PLATFORM_FEE}</span>
              </div>
            )}
            <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between">
              <span className="font-black text-[#070e38] text-[15px]">To Pay</span>
              <span className="font-black text-[#070e38] text-[18px]">₹{finalTotal}</span>
            </div>
          </div>
        </section>

        {/* Minimum Order Warning */}
        {totalPrice < MIN_ORDER && (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-start animate-bounce">
            <AlertTriangle className="text-amber-500 flex-shrink-0" size={18} />
            <div>
              <p className="text-[13px] font-bold text-amber-900">Minimum Order required: ₹{MIN_ORDER}</p>
              <p className="text-[12px] text-amber-700 mt-0.5">Add ₹{MIN_ORDER - totalPrice} more to place order</p>
            </div>
          </div>
        )}

        {/* Payment Method */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-black/5 pb-8">
          <h2 className="font-black text-[15px] text-[#070e38] mb-4">Payment Method</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod("upi")}
              className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'upi' ? 'border-[#c9a227] bg-[#fef8e7]' : 'border-gray-50 bg-gray-50/50 grayscale'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === 'upi' ? 'bg-[#c9a227] text-white' : 'bg-white text-gray-300'}`}>
                <QrCode size={20} />
              </div>
              <p className={`font-black text-[12px] ${paymentMethod === 'upi' ? 'text-[#8b6e15]' : 'text-gray-400'}`}>Instant UPI</p>
              {paymentMethod === 'upi' && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-[#c9a227] rounded-full animate-pulse" />
                </div>
              )}
            </button>

            <button
              onClick={() => setPaymentMethod("whatsapp")}
              className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'whatsapp' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-50 bg-gray-50/50 grayscale'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === 'whatsapp' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-300'}`}>
                <Banknote size={20} />
              </div>
              <p className={`font-black text-[12px] ${paymentMethod === 'whatsapp' ? 'text-emerald-700' : 'text-gray-400'}`}>Cash on Delivery</p>
              {paymentMethod === 'whatsapp' && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                </div>
              )}
            </button>
          </div>
        </section>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 p-4 pb-8 safe-bottom shadow-[0_-8px_24px_rgba(0,0,0,0.05)] z-50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Amount to pay</p>
            <p className="text-[20px] font-black text-[#070e38]">₹{finalTotal}</p>
          </div>
          <button
            onClick={handleOrder}
            type="button"
            disabled={isSubmitting || !name || !phone || !location || totalPrice < MIN_ORDER}
            className="flex-1 bg-[#070e38] text-white h-[56px] rounded-2xl font-black text-[16px] flex items-center justify-center gap-2.5 shadow-2xl shadow-blue-900/40 active:scale-[0.97] transition-all disabled:opacity-50 disabled:grayscale"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : paymentMethod === 'upi' ? (
              <>Pay &amp; Place Order</>
            ) : (
              <>Place Order</>
            )}
            <ChevronRight size={18} strokeWidth={3} />
          </button>
        </div>
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

      {/* Custom Styles for better visual separation */}
      <style jsx>{`
        header { backdrop-filter: blur(10px); background: rgba(255,255,255,0.9); }
        .safe-top { padding-top: max(12px, env(safe-area-inset-top)); }
      `}</style>
    </div>
  );
}
