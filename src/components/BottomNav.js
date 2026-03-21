"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, Clock } from "lucide-react";
import { useCart } from "@/components/CartContext";

const NAV_ITEMS = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Cart", icon: ShoppingCart, href: "/cart" },
  { label: "Orders", icon: Clock, href: "/orders" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-16 bg-white border-t border-slate-100 flex items-center justify-around px-4 z-50">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        const isCart = item.label === "Cart";

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-0.5 w-20 h-full transition-colors select-none ${
              isActive ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? "bg-emerald-50" : ""}`}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {/* Cart badge */}
              {isCart && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-bold ${isActive ? "opacity-100" : "opacity-55"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
