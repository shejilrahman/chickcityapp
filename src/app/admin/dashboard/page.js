"use client";

import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import OrderCard from "@/components/OrderCard";
import { Store, LogOut, Bell, Clock, CheckCircle, XCircle } from "lucide-react";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("processing");
  const router = useRouter();
  
  // To track previous orders count for sound alerts
  const ordersCountRef = useRef(0);
  const initialLoadRef = useRef(true);

  // Authentication Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/admin/login");
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Request Notification Permissions
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Fetch Orders
  useEffect(() => {
    if (loading) return;

    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const newCount = ordersData.length;
      
      // If not initial load and there are new orders, play sound & notify
      if (!initialLoadRef.current && newCount > ordersCountRef.current) {
        playAlertSound();
        showNotification("New Order Received!");
      }

      setOrders(ordersData);
      ordersCountRef.current = newCount;
      initialLoadRef.current = false;
    });

    return () => unsubscribe();
  }, [loading]);

  const playAlertSound = () => {
    try {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      audio.play().catch(e => console.log("Audio play prevented", e));
    } catch (e) {}
  };

  const showNotification = (msg) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Noor al Mandi", { body: msg, icon: "/icons/icon-192.png" });
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  // Filter and Sort orders based on Active Tab
  const processingStates = ["pending", "confirmed", "out-for-delivery"];
  
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "processing") return processingStates.includes(order.status);
    if (activeTab === "delivered") return order.status === "delivered";
    if (activeTab === "rejected") return order.status === "rejected";
    return true;
  });

  // Sort logic: Processing tab shows oldest active orders at the top. Others show newest at the top.
  const displayOrders = activeTab === "processing" 
    ? [...filteredOrders].reverse() 
    : filteredOrders;

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white p-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <Store size={20} className="text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">Admin Dashboard</h1>
          </div>
         
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            <span>Logout</span>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 py-8">
        {/* Header & Tabs */}
        <div className="mb-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Orders Overview</h2>
              <p className="text-gray-500 text-sm mt-1">Manage all customer orders here</p>
            </div>
            <div className="flex py-1.5 px-3 bg-green-100 text-green-800 rounded-lg items-center space-x-2 font-bold text-sm">
               <Bell size={16} />
               <span className="hidden sm:inline">Monitoring</span>
            </div>
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-2 hide-scrollbar">
            <button
              onClick={() => setActiveTab("processing")}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${
                activeTab === "processing" 
                  ? "bg-gray-900 text-white shadow-sm" 
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Clock size={16} />
              <span>Processing</span>
              {activeTab === "processing" && (
                <span className="ml-1.5 bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                  {displayOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("delivered")}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${
                activeTab === "delivered" 
                  ? "bg-green-600 text-white shadow-sm" 
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <CheckCircle size={16} />
              <span>Delivered</span>
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${
                activeTab === "rejected" 
                  ? "bg-red-600 text-white shadow-sm" 
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <XCircle size={16} />
              <span>Rejected</span>
            </button>
          </div>
        </div>

        {/* Order List */}
        {displayOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="text-gray-400 mb-3 flex justify-center"><Store size={48} opacity={0.5}/></div>
            <p className="text-gray-500 font-medium">No {activeTab} orders found.</p>
            {activeTab === "processing" && <p className="text-sm text-gray-400">Waiting for customers to order...</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
