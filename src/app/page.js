"use client";

export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import ProductListItem from "@/components/ProductListItem";
import CartDrawer from "@/components/CartDrawer";
import { Clock, Loader2 } from "lucide-react";
import Fuse from "fuse.js";
import Link from "next/link";
import Image from "next/image";

const PAGE_SIZE = 20;

// ── Horizontal Category Strip ────────────────────────────────────────────────
function CategoryStrip({ categories, selected, onSelect }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const active = el.querySelector("[data-active='true']");
    if (active) {
      // Calculate scroll position to keep it in view without pushing too far right
      const scrollLeft = active.offsetLeft - el.clientWidth / 2 + active.clientWidth / 2;
      el.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [selected]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2.5 overflow-x-auto hide-scrollbar px-4 pb-3 pt-1"
    >
      {categories.map((cat) => {
        const title = cat.title || cat;
        const isActive = selected === title;
        const label = title === "All" || title === "All Menu" ? "All Menu" : title;
        const img = cat.image;
        const emoji = cat.emoji;

        return (
          <button
            key={title}
            data-active={isActive}
            onClick={() => onSelect(title)}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 transition-all duration-200"
            style={{ minWidth: "60px" }}
          >
            {/* Image / Emoji Circle */}
            <div
              className="relative overflow-hidden transition-all duration-200"
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "18px",
                border: isActive
                  ? "2.5px solid #c9a227"
                  : "2.5px solid transparent",
                boxShadow: isActive
                  ? "0 0 0 3px rgba(201,162,39,0.18), 0 4px 12px rgba(0,0,0,0.12)"
                  : "0 2px 8px rgba(0,0,0,0.08)",
                transform: isActive ? "scale(1.08)" : "scale(1)",
                background: img ? "transparent" : "rgba(255,255,255,0.12)",
              }}
            >
              {img ? (
                <Image
                  src={img}
                  alt={label}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[22px]">
                  {emoji || "📦"}
                </div>
              )}
              {isActive && (
                <div
                  className="absolute inset-0"
                  style={{ background: "rgba(201,162,39,0.08)", borderRadius: "inherit" }}
                />
              )}
            </div>

            {/* Label */}
            <span
              className="text-[9.5px] font-bold text-center leading-tight"
              style={{
                color: isActive ? "#c9a227" : "rgba(255,255,255,0.7)",
                maxWidth: "60px",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                wordBreak: "break-word",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const [allProducts, setAllProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Menu");
  const [isHydrated, setIsHydrated] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loaderRef  = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then(r => r.json()),
      fetch("/api/categories").then(r => r.json())
    ])
    .then(([prodData, catData]) => {
      setAllProducts(Array.isArray(prodData) ? prodData.filter((p) => !p.hidden) : []);
      setAllCategories(Array.isArray(catData) ? catData : []);
      setProductsLoaded(true);
    })
    .catch(() => setProductsLoaded(true));
  }, []);

  useEffect(() => { setIsHydrated(true); }, []);

  const categories = useMemo(() => {
    const activeFromProducts = Array.from(new Set(allProducts.map((p) => p.category)));
    const enriched = allCategories.filter(c =>
      activeFromProducts.includes(c.title) || c.id === "all" || c.title === "All" || c.title === "All Menu"
    );
    const dbAll = allCategories.find(c => c.id === "all" || c.title === "All" || c.title === "All Menu");
    const finalAll = dbAll || { id: "all", title: "All Menu", image: "/categories/all-menu.jpg" };
    const others = enriched.filter(c => c.title !== "All" && c.title !== "All Menu" && c.id !== "all");
    return [finalAll, ...others];
  }, [allProducts, allCategories]);

  const filteredProducts = useMemo(() => {
    const categoryFiltered = allProducts.filter(p =>
      selectedCategory === "All Menu" || p.category === selectedCategory
    );

    if (!searchTerm.trim()) {
      if (selectedCategory === "All Menu") {
        const featured = categoryFiltered.filter(p => p.featured);
        const rest     = categoryFiltered.filter(p => !p.featured);
        return [...featured, ...rest];
      }
      return categoryFiltered;
    }

    const fuse = new Fuse(categoryFiltered, {
      keys: [{ name: "name", weight: 0.7 }, { name: "category", weight: 0.2 }, { name: "tags", weight: 0.3 }],
      threshold: 0.4, distance: 100, minMatchCharLength: 2, includeScore: true, ignoreLocation: true,
    });
    const normalized = searchTerm.toLowerCase().trim().replace(/\s+/g, " ").replace(/[^\w\s\u0D00-\u0D7F]/g, "");
    const words = normalized.split(" ");
    if (words.length > 1) {
      const results = words.flatMap(w => fuse.search(w));
      const unique  = [...new Map(results.map(r => [r.item.id, r])).values()];
      return unique.sort((a, b) => a.score - b.score).map(r => r.item);
    }
    return fuse.search(normalized).map(r => r.item);
  }, [searchTerm, selectedCategory, allProducts]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [searchTerm, selectedCategory]);

  const handleObserver = useCallback((entries) => {
    if (entries[0].isIntersecting) {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredProducts.length));
    }
  }, [filteredProducts.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: contentRef.current, rootMargin: "200px", threshold: 0,
    });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore         = visibleCount < filteredProducts.length;
  const isSearching     = !!searchTerm.trim();

  if (!isHydrated || !productsLoaded) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#f5f0eb" }}>

      {/* ══ STICKY HEADER ══ */}
      <header className="flex-shrink-0 z-40" style={{
        background: "linear-gradient(170deg, #070e38 0%, #0f1b5c 50%, #1a2a80 100%)",
        boxShadow: "0 4px 24px rgba(7,14,56,0.5)",
      }}>
        {/* Geometric overlay */}
        <div className="absolute inset-x-0 top-0 h-full pointer-events-none overflow-hidden" style={{
          backgroundImage: `repeating-linear-gradient(45deg,transparent,transparent 20px,rgba(201,162,39,0.04) 20px,rgba(201,162,39,0.04) 21px),
                            repeating-linear-gradient(-45deg,transparent,transparent 20px,rgba(201,162,39,0.04) 20px,rgba(201,162,39,0.04) 21px)`,
        }} />
        {/* Gold rule */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px]" style={{ background: "linear-gradient(90deg,transparent,#c9a227 35%,#f5d171 55%,#c9a227 75%,transparent)" }} />
        {/* Crescent */}
        <div className="absolute -top-5 -right-5 w-28 h-28 opacity-[0.15] pointer-events-none">
          <svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="44" fill="#c9a227"/><circle cx="66" cy="36" r="36" fill="#070e38"/></svg>
        </div>
        {/* Stars */}
        {["top-2 left-[12%]","top-5 left-[48%]","top-1 right-[18%]"].map((pos,i) => (
          <span key={i} className={`absolute ${pos} text-amber-400/40 text-xs animate-pulse`} style={{ animationDelay:`${i*0.7}s` }}>✦</span>
        ))}

        <div className="relative px-4 pt-3">
          {/* Brand Row */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 style={{
                  fontFamily: "var(--font-cinzel),'Cinzel',Georgia,serif",
                  fontSize: "21px", fontWeight: 900,
                  letterSpacing: "0.04em", lineHeight: 1, color: "#fff",
                  textShadow: "0 0 14px rgba(201,162,39,0.5),0 1px 4px rgba(0,0,0,0.6)",
                  margin: 0,
                }}>Noor al Mandi</h1>
                <div className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background:"rgba(201,162,39,0.18)", border:"1px solid rgba(201,162,39,0.45)" }}>
                  <span className="text-[10px]">☪</span>
                  <span className="text-[9px] font-black uppercase tracking-wider" style={{ color:"#f5d171" }}>Halal</span>
                </div>
              </div>
              <p className="text-[9.5px] font-semibold mt-0.5 tracking-widest uppercase" style={{ color:"rgba(201,162,39,0.65)" }}>
                Arabic Mandi · Grills · Al Fahm
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Info badges */}
              <div className="hidden sm:flex items-center gap-1.5">
                {[
                  { e: "🚀", t: "30–45 min" },
                  { e: "📍", t: "10 km" },
                  { e: "🥡", t: "Min ₹100" },
                  { e: "📍", t: "Thriprayar" },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(201,162,39,0.2)" }}>
                    <span className="text-[11px]">{p.e}</span>
                    <span className="text-[9px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{p.t}</span>
                  </div>
                ))}
              </div>
              <Link href="/orders" className="w-9 h-9 bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center active:bg-white/25 transition-colors">
                <Clock size={17} className="text-white" strokeWidth={2} />
              </Link>
            </div>
          </div>

          {/* Mobile info row */}
          <div className="flex sm:hidden items-center gap-1.5 mb-2 overflow-x-auto hide-scrollbar pb-1">
            {[
              { e: "🚀", t: "30–45 min" },
              { e: "📍", t: "10 km" },
              { e: "🥡", t: "Min ₹100" },
              { e: "📍", t: "Thriprayar" },
            ].map((p, i) => (
              <div key={i} className="flex-shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(201,162,39,0.2)" }}>
                <span className="text-[11px]">{p.e}</span>
                <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: "rgba(255,255,255,0.8)" }}>{p.t}</span>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>
        </div>

        {/* Category strip stays inside header (dark bg) */}
        <CategoryStrip
          categories={categories}
          selected={selectedCategory}
          onSelect={(cat) => { setSelectedCategory(cat); setSearchTerm(""); }}
        />
      </header>

      {/* ══ SCROLLABLE CONTENT ══ */}
      <main
        ref={contentRef}
        className="flex-1 overflow-y-auto hide-scrollbar"
        style={{ background: "#f5f0eb" }}
      >
        {/* Section label */}
        <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-black text-[#0d1654]">
            {isSearching
              ? `Results for "${searchTerm}"`
              : selectedCategory === "All Menu"
              ? "✨ All Menu"
              : selectedCategory.charAt(0) + selectedCategory.slice(1).toLowerCase()}
          </h2>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
            {filteredProducts.length} items
          </span>
        </div>

        {filteredProducts.length > 0 ? (
          <>
            {isSearching ? (
              <div className="divide-y divide-stone-100">
                {visibleProducts.map(product => (
                  <ProductListItem key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 px-3 pb-3">
                {visibleProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={loaderRef} className="py-6 flex items-center justify-center">
              {hasMore && (
                <div className="flex items-center gap-2 text-amber-500 text-xs">
                  <Loader2 size={14} className="animate-spin" />
                  Loading more…
                </div>
              )}
              {!hasMore && filteredProducts.length > PAGE_SIZE && (
                <p className="text-[11px] text-stone-400">All {filteredProducts.length} items shown</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center px-8">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 shadow-sm" style={{ background:"#fff3d6" }}>
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="text-[16px] font-black text-[#0d1654]">Nothing found</h3>
            <p className="text-stone-400 mt-1.5 text-sm">Try a different word or pick a category</p>
            <button
              onClick={() => { setSearchTerm(""); setSelectedCategory("All Menu"); }}
              className="mt-5 px-6 py-2.5 rounded-xl text-sm font-black text-white"
              style={{ background:"linear-gradient(135deg,#0d1654,#1a2a80)" }}
            >
              Show All
            </button>
          </div>
        )}
      </main>

      <CartDrawer />
    </div>
  );
}
