"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Lock, Mail, Truck } from "lucide-react";

export default function DeliveryLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const allowedEmails = (process.env.NEXT_PUBLIC_DELIVERY_EMAILS || "")
        .split(",")
        .map(s => s.trim().toLowerCase());

      if (!allowedEmails.includes(email.toLowerCase())) {
        setError("This account is not authorized for delivery access.");
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      router.push("/delivery");
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 border border-orange-100">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
            <Truck size={32} />
          </div>
        </div>

        <h1 className="text-2xl font-black text-center text-gray-900 mb-1">Delivery Login</h1>
        <p className="text-center text-gray-400 mb-8 text-sm">Sign in to manage deliveries</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center mb-6 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all text-[15px]"
                placeholder="delivery@gmail.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all text-[15px]"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3.5 font-black transition-all disabled:opacity-60 active:scale-[0.98] mt-2 text-[15px]"
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
