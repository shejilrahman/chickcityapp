"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Clock, CheckCircle, Truck, Package, PackageOpen, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const statusConfig = {
  pending:          { icon: Clock,        color: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-200",  label: "Order Pending",        subtext: "We've received your order" },
  confirmed:        { icon: Package,      color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-200",   label: "Confirmed",             subtext: "Your order is being packed" },
  "out-for-delivery":{ icon: Truck,       color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200", label: "Out for Delivery",      subtext: "On the way to you!" },
  delivered:        { icon: CheckCircle,  color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200",  label: "Delivered ✓",          subtext: "Enjoy your groceries!" },
  rejected:         { icon: PackageOpen,  color: "text-red-500",    bg: "bg-red-50",    border: "border-red-200",    label: "Cancelled",             subtext: "This order was rejected" },
};

export default function OrderTracker() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pastOrderIds = JSON.parse(localStorage.getItem("restaurant-orders") || "[]");
    if (pastOrderIds.length === 0) {
      setLoading(false);
      return;
    }

    const recentOrderIds = pastOrderIds.slice(-5);
    const unsubs = [];
    const ordersData = {};

    recentOrderIds.forEach(orderId => {
      const unsub = onSnapshot(doc(db, "orders", orderId), (docSnap) => {
        if (docSnap.exists()) {
          ordersData[orderId] = { id: orderId, ...docSnap.data() };
          setOrders(Object.values(ordersData).sort((a, b) => {
            const timeA = a.timestamp?.toMillis?.() || 0;
            const timeB = b.timestamp?.toMillis?.() || 0;
            return timeB - timeA;
          }));
        }
      });
      unsubs.push(unsub);
    });

    setLoading(false);
    return () => unsubs.forEach(unsub => unsub());
  }, []);

  if (loading) return null;

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-5">
          <Package size={36} className="text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">No orders yet</h3>
        <p className="text-gray-400 text-sm max-w-xs">
          Once you place an order, you can track it live right here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order, idx) => {
        const cfg = statusConfig[order.status] || statusConfig.pending;
        const Icon = cfg.icon;
        const date = order.timestamp?.toDate
          ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(order.timestamp.toDate())
          : "Just now";

        return (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`rounded-2xl border ${cfg.bg} ${cfg.border} overflow-hidden`}
          >
            {/* Status Header */}
            <div className="px-4 pt-4 pb-3 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm border ${cfg.border}`}>
                <Icon size={20} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-[15px] ${cfg.color.replace("text-", "text-").replace("-500", "-700").replace("-600", "-700")}`}>{cfg.label}</p>
                <p className="text-xs text-gray-500">{cfg.subtext}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-lg text-gray-900">₹{order.total}</p>
                <p className="text-[10px] text-gray-400">{order.items?.length || 0} items</p>
              </div>
            </div>

            {/* Items Preview */}
            <div className="px-4 pb-3">
              <div className="bg-white/70 rounded-xl px-3 py-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Items</p>
                <div className="space-y-1">
                  {order.items?.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700"><span className="font-semibold">{item.quantity}×</span> {item.name}</span>
                      <span className="font-semibold text-gray-900">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <p className="text-xs text-gray-400">+ {order.items.length - 3} more items</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 pb-3 flex items-center justify-between">
              <p className="text-[11px] text-gray-400">{date}</p>
              <p className="text-[11px] font-mono text-gray-300 truncate max-w-[120px]">#{order.id.slice(-8)}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
