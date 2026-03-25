import Link from "next/link";
import { usePathname } from "next/navigation";
import { Image as ImageIcon, FolderOpen, Star, Scale, EyeOff, LayoutDashboard, Edit3, ShoppingBag, Settings, Tag } from "lucide-react";

const links = [
  { href: "/admin",              icon: LayoutDashboard, label: "Home" },
  { href: "/admin/dashboard",    icon: LayoutDashboard, label: "Orders" },
  { href: "/admin/products",     icon: ShoppingBag,     label: "Products" },
  { href: "/admin/categories",   icon: FolderOpen,      label: "Categories" },
  { href: "/admin/settings",     icon: Settings,        label: "Settings" },
  { href: "/admin/coupons",      icon: Tag,             label: "Coupons" },
  { href: "/admin/images",       icon: ImageIcon,       label: "Images" },
  // { href: "/admin/weight-slabs", icon: Scale,           label: "Slabs" },
  { href: "/admin/featured",     icon: Star,            label: "Featured" },
  { href: "/admin/hidden",       icon: EyeOff,          label: "Hidden" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1 border-b border-slate-800 bg-slate-950 px-4 py-1.5 flex-shrink-0">
      {links.map(({ href, icon: Icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-semibold transition-colors
              ${active
                ? "bg-blue-600/20 text-blue-300"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"}`}
          >
            <Icon size={13} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
