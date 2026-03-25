"use client";

export const dynamic = 'force-dynamic';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Star,
  FolderOpen,
  Image as ImageIcon,
  Scale,
  EyeOff,
  LogOut,
  ChevronRight,
  Store,
  ShoppingBag,
  Settings,
  Tag,
  Edit3,
} from "lucide-react";

const ADMIN_PAGES = [
  {
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    label: "Orders Dashboard",
    desc: "View & manage customer orders in real-time",
    color: "from-green-500 to-emerald-600",
  },
  {
    href: "/admin/products",
    icon: ShoppingBag,
    label: "Products",
    desc: "Add, edit, show/hide, and delete menu items",
    color: "from-orange-500 to-red-500",
  },
  {
    href: "/admin/categories",
    icon: FolderOpen,
    label: "Categories",
    desc: "Manage restaurant menu categories in Firestore",
    color: "from-blue-500 to-indigo-600",
  },
  {
    href: "/admin/settings",
    icon: Settings,
    label: "Store Settings",
    desc: "Hours, WhatsApp number, delivery fee, UPI ID",
    color: "from-teal-500 to-cyan-600",
  },
  {
    href: "/admin/coupons",
    icon: Tag,
    label: "Coupons",
    desc: "Create and manage discount codes",
    color: "from-pink-500 to-rose-600",
  },
  {
    href: "/admin/images",
    icon: ImageIcon,
    label: "Product Images",
    desc: "Upload & crop photos for menu items",
    color: "from-purple-500 to-violet-600",
  },

  {
    href: "/admin/featured",
    icon: Star,
    label: "Featured",
    desc: "Pin items to the homepage spotlight",
    color: "from-yellow-400 to-orange-500",
  },
  {
    href: "/admin/hidden",
    icon: EyeOff,
    label: "Hidden Items",
    desc: "Hide products from the storefront",
    color: "from-rose-500 to-red-600",
  },
];

export default function AdminIndexPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/admin/login");
      else setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
              <Store size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight leading-none">Admin Panel</h1>
              <p className="text-slate-500 text-[11px] mt-0.5">Noor al Mandi</p>
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-white mb-1">What would you like to manage?</h2>
          <p className="text-slate-500 text-sm">Select a section to get started</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ADMIN_PAGES.map(({ href, icon: Icon, label, desc, color, bg, border, text }) => (
            <Link
              key={href}
              href={href}
              className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 hover:bg-slate-800/70 transition-all duration-200 flex items-start gap-4"
            >
              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <Icon size={20} className="text-white" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-[15px] leading-tight">{label}</h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{desc}</p>
              </div>

              {/* Arrow */}
              <ChevronRight
                size={16}
                className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all mt-0.5 flex-shrink-0"
              />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
