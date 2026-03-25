"use client";

import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  Truck, LogOut, Phone, MapPin, CheckCircle2,
  Loader2, Clock, Package, Navigation, RefreshCw
} from "lucide-react";

// ── Helper: extract Google Maps URL or construct one from raw text ──
function buildMapsUrl(customerLocation) {
  if (!customerLocation) return null;
  // MapPicker saves "address text\nhttps://www.google.com/maps?q=..." — extract the link
  const match = customerLocation.match(/https?:\/\/[^\s]+/);
  if (match) return match[0];
  // Fallback: search for the raw address text
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customerLocation)}`;
}

function timeAgo(ts) {
  if (!ts?.toDate) return "Just now";
  const diff = (Date.now() - ts.toDate().getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function DeliveryPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);
  const prevCountRef = useRef(0);

  // Auth gate
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/delivery/login");
        return;
      }

      const allowed = (process.env.NEXT_PUBLIC_DELIVERY_EMAILS || "")
        .split(",")
        .map(s => s.trim().toLowerCase());

      if (!allowed.includes(u.email?.toLowerCase())) {
        signOut(auth);
        router.push("/delivery/login");
        return;
      }
      setUser(u);
    });
    return unsub;
  }, [router]);

  // Real-time listener — only "out-for-delivery" orders
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("status", "==", "out-for-delivery")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)); // oldest first

      // Vibrate on new order
      if (data.length > prevCountRef.current && prevCountRef.current >= 0) {
        try { navigator.vibrate?.([200, 100, 200]); } catch {}
      }
      prevCountRef.current = data.length;

      setOrders(data);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const markDelivered = async (orderId) => {
    setMarkingId(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), { status: "delivered" });
    } catch (e) {
      alert("Failed to update. Please try again.");
    } finally {
      setMarkingId(null);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 pb-10">

      {/* Header */}
      <header className="bg-orange-500 text-white px-4 py-4 sticky top-0 z-40 shadow-lg shadow-orange-500/30">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Truck size={20} />
            </div>
            <div>
              <h1 className="font-black text-[17px] leading-none">Deliveries</h1>
              <p className="text-orange-100 text-xs mt-0.5">{orders.length} active</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => signOut(auth)}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        {orders.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center pt-24 text-center">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-5 border border-orange-100">
              <Package size={38} className="text-orange-200" />
            </div>
            <h2 className="text-xl font-black text-gray-700 mb-2">No Active Deliveries</h2>
            <p className="text-gray-400 text-sm max-w-xs">
              Orders marked &ldquo;Out for Delivery&rdquo; by the admin will appear here in real-time.
            </p>
            <div className="flex items-center gap-2 mt-6 bg-orange-100 text-orange-600 text-xs font-bold px-4 py-2 rounded-full">
              <RefreshCw size={12} className="animate-spin" />
              Watching for new deliveries…
            </div>
          </div>
        ) : (
          orders.map(order => {
            const mapsUrl = buildMapsUrl(order.customerLocation);
            const isMarking = markingId === order.id;

            return (
              <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-orange-100 overflow-hidden">

                {/* Order Header */}
                <div className="bg-orange-500 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-white" />
                    <span className="text-white font-black text-sm">Out for Delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-orange-100 text-xs">
                    <Clock size={11} />
                    {timeAgo(order.timestamp)}
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Customer Info */}
                  <div className="space-y-2">
                    <h3 className="font-black text-lg text-gray-900">{order.customerName}</h3>

                    <a
                      href={`tel:${order.customerPhone}`}
                      className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2.5 rounded-2xl font-bold text-sm active:bg-green-100 transition-colors"
                    >
                      <Phone size={16} />
                      {order.customerPhone}
                      <span className="ml-auto text-xs text-green-500 font-normal">Tap to call</span>
                    </a>

                    {/* Location / Navigate */}
                    {mapsUrl ? (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2.5 rounded-2xl font-bold text-sm active:bg-blue-100 transition-colors"
                      >
                        <Navigation size={16} className="flex-shrink-0 mt-0.5 text-blue-500" />
                        <span className="flex-1 text-xs leading-relaxed line-clamp-2 text-blue-600">
                          {order.customerLocation?.split("\n")[0] || "View on Map"}
                        </span>
                        <span className="text-xs text-blue-400 font-normal flex-shrink-0">Maps ↗</span>
                      </a>
                    ) : (
                      <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-2xl text-sm text-gray-500">
                        <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                        <span className="text-xs leading-relaxed">{order.customerLocation || "No address provided"}</span>
                      </div>
                    )}

                    {order.customerLandmark && (
                      <p className="text-xs text-gray-400 px-1">
                        🏢 <span className="font-medium text-gray-500">{order.customerLandmark}</span>
                      </p>
                    )}
                  </div>

                  {/* Items */}
                  <div className="bg-gray-50 rounded-2xl p-3">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Items</h4>
                    <div className="space-y-1">
                      {(order.items || []).map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">
                            <span className="font-bold">{item.quantity}×</span>{" "}
                            {item.name}{item.unit ? ` (${item.unit})` : ""}
                          </span>
                          <span className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-black text-gray-900">
                      <span>Total</span>
                      <span className="text-orange-600">₹{order.total?.toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Mark Delivered Button */}
                  <button
                    onClick={() => markDelivered(order.id)}
                    disabled={isMarking}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-black text-[16px] py-4 rounded-2xl flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all shadow-lg shadow-green-600/25"
                  >
                    {isMarking
                      ? <><Loader2 size={20} className="animate-spin" /> Confirming…</>
                      : <><CheckCircle2 size={22} /> Mark as Delivered</>
                    }
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
