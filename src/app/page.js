"use client";

export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import CategorySidebar from "@/components/CategorySidebar";
import ProductCard from "@/components/ProductCard";
import ProductListItem from "@/components/ProductListItem";
import CartDrawer from "@/components/CartDrawer";
import { Clock, Loader2 } from "lucide-react";
import Fuse from "fuse.js";
import Link from "next/link";

const PAGE_SIZE = 20; // Start small for fast first paint; infinite scroll loads more

export default function Home() {
  const [allProducts, setAllProducts] = useState([]);     // fetched from Firestore via API
  const [allCategories, setAllCategories] = useState([]); // fetched from Firestore
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [pastItems, setPastItems] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loaderRef  = useRef(null);
  const contentRef = useRef(null);

  // Fetch products and categories from Firestore (via API)
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
    .catch((err) => {
      console.error("Failed to load data", err);
      setProductsLoaded(true);
    });
  }, []);

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem("grocery-history") || "[]");
      setPastItems(history);
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const categories = useMemo(() => {
    const activeFromProducts = Array.from(new Set(allProducts.map((p) => p.category)));
    const enriched = allCategories.filter(c => activeFromProducts.includes(c.title) || c.id === "all" || c.title === "All");
    
    // Find the Firestore "All" category if it exists
    const dbAll = allCategories.find(c => c.id === "all" || c.title === "All");
    
    // Final "All" item: prefers Firestore data, fallbacks to hardcoded
    const finalAll = dbAll || { id: "all", title: "All", emoji: "🍗" };
    
    // Filter out categories that are not "All" but are active in products
    const others = enriched.filter(c => c.title !== "All" && c.id !== "all");
    
    return [finalAll, ...others];
  }, [allProducts, allCategories]);

  const filteredProducts = useMemo(() => {
    const categoryFiltered = allProducts.filter(p =>
      selectedCategory === "All" || p.category === selectedCategory
    );

    if (!searchTerm.trim()) {
      if (selectedCategory === "All") {
        const featured = categoryFiltered.filter(p => p.featured);
        const rest     = categoryFiltered.filter(p => !p.featured);
        return [...featured, ...rest];
      }
      return categoryFiltered;
    }

    const fuseOptions = {
      keys: [
        { name: "name",     weight: 0.7 },
        { name: "category", weight: 0.2 },
        { name: "tags",     weight: 0.3 },
      ],
      threshold: 0.4, distance: 100, minMatchCharLength: 2,
      includeScore: true, ignoreLocation: true,
    };
    const fuse       = new Fuse(categoryFiltered, fuseOptions);
    const normalized = searchTerm.toLowerCase().trim()
      .replace(/\s+/g, " ").replace(/[^\w\s\u0D00-\u0D7F]/g, "");
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
  const pastProducts    = allProducts.filter(p => pastItems.includes(p.id)).slice(0, 8);
  const isSearching     = !!searchTerm.trim();

  /* ─── Loading state — wait for hydration and data ─── */
  if (!isHydrated || !productsLoaded) return null;

  /* ─── Full page ─── */
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#f0faf4" }}>

      {/* ══════════════════════════════════════════
          STICKY HEADER  
      ══════════════════════════════════════════ */}
      <header className="flex-shrink-0 z-40">
        <div
          className="relative overflow-hidden px-4 pt-3 pb-3"
          style={{
            background: "linear-gradient(160deg, #022c22 0%, #064e3b 45%, #065f46 100%)",
          }}
        >
          {/* ── Decorative Arabic pattern overlay ── */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `repeating-linear-gradient(45deg, #fbbf24 0, #fbbf24 1px, transparent 0, transparent 50%)`,
            backgroundSize: "20px 20px",
          }} />

          {/* ── Glowing crescent top-right ── */}
          <div className="absolute -top-4 -right-4 w-28 h-28 opacity-15 pointer-events-none">
            <svg viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="44" fill="#fbbf24" />
              <circle cx="64" cy="38" r="36" fill="#022c22" />
            </svg>
          </div>

          {/* ── Subtle stars ── */}
          {["top-2 left-[15%]", "top-5 left-[45%]", "top-1 right-[20%]"].map((pos, i) => (
            <span key={i} className={`absolute ${pos} text-amber-400/40 text-xs animate-pulse`} style={{ animationDelay: `${i * 0.7}s` }}>✦</span>
          ))}

          {/* ── TOP ROW: brand + orders ── */}
          <div className="relative flex items-center justify-between mb-2.5">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-white font-black text-[22px] tracking-tight leading-none drop-shadow-md">
                    ABC 
                  </h1>
                  {/* Eid badge */}
                  <div className="flex items-center gap-1 bg-amber-400/20 border border-amber-400/40 rounded-full px-2 py-0.5">
                    <span className="text-[11px]">🌙</span>
                    <span className="text-amber-300 text-[9px] font-black uppercase tracking-wider">Eid Special</span>
                  </div>
                </div>
                <p className="text-emerald-300/70 text-[10px] font-semibold mt-0.5 tracking-widest uppercase">
                  Original Arabic Mandi · Grills · Al Fahm
                </p>
              </div>
            </div>

            {/* Orders icon button */}
            <Link
              href="/orders"
              className="w-9 h-9 bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center active:bg-white/25 transition-colors"
            >
              <Clock size={17} className="text-white" strokeWidth={2} />
            </Link>
          </div>

          {/* ── PROMISE BADGES ROW — one line, compact ── */}
          <div className="relative flex items-center gap-2 mb-3 overflow-x-auto hide-scrollbar">
            {[
              { emoji: "🚀", text: "30-45 min" },
              { emoji: "📍", text: "5 km radius" },
              { emoji: "🥡", text: "Min ₹300" },
            ].map((p, i) => (
              <div key={i} className="flex-shrink-0 flex items-center gap-1 bg-white/10 border border-white/15 rounded-full px-2.5 py-1">
                <span className="text-[12px]">{p.emoji}</span>
                <span className="text-white/90 text-[10px] font-semibold whitespace-nowrap">{p.text}</span>
              </div>
            ))}
            {/* Decorative divider + Eid text */}
            <div className="flex-shrink-0 flex items-center gap-1 ml-auto">
              <span className="text-amber-400/60 text-[10px]">✦</span>
              <span className="text-amber-300/80 text-[10px] font-bold tracking-widest uppercase">Eid Mubarak</span>
              <span className="text-amber-400/60 text-[10px]">✦</span>
            </div>
          </div>

          {/* ── SEARCH BAR ── */}
          <div className="relative">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          BODY: Sidebar + Content
      ══════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Category Sidebar */}
        <CategorySidebar
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={(cat) => {
            setSelectedCategory(cat);
            setSearchTerm("");
          }}
        />

        {/* Right scrollable content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto hide-scrollbar"
          style={{ background: "#f0faf4" }}
        >

          {/* Section header pill */}
          <div className="px-3 pt-3 pb-2 flex items-baseline justify-between">
            <h2 className="text-[13px] font-bold text-green-900">
              {isSearching
                ? `Results for "${searchTerm}"`
                : selectedCategory === "All"
                ? "✨ All Products"
                : selectedCategory.charAt(0) + selectedCategory.slice(1).toLowerCase()}
            </h2>
            <span className="text-[11px] font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              {filteredProducts.length} items
            </span>
          </div>

          {/* ── Buy Again strip ── */}
          {pastProducts.length > 0 && selectedCategory === "All" && !isSearching && (
            <div className="px-3 mb-3">
              <p className="text-[11px] font-bold text-green-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                🔁 <span>Buy Again</span>
              </p>
              <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 snap-x">
                {pastProducts.map(product => (
                  <div key={product.id} className="min-w-[106px] max-w-[106px] snap-start">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
              {/* subtle separator */}
              <div className="h-px bg-green-100 mt-3" />
            </div>
          )}

          {/* ── Products ── */}
          {filteredProducts.length > 0 ? (
            <>
              {isSearching ? (
                /* Search → list view */
                <div className="divide-y divide-purple-50">
                  {visibleProducts.map(product => (
                    <ProductListItem key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                /* Browse → 2-col grid with pastel card bg */
                <div className="grid grid-cols-2 gap-[1.5px]" style={{ background: "#d1fae5" }}>
                  {visibleProducts.map(product => (
                    <div key={product.id} className="bg-white p-2.5">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}

              {/* Infinite scroll sentinel */}
              <div ref={loaderRef} className="py-6 flex items-center justify-center">
                {hasMore && (
                  <div className="flex items-center gap-2 text-green-400 text-xs">
                    <Loader2 size={14} className="animate-spin" />
                    Loading more…
                  </div>
                )}
                {!hasMore && filteredProducts.length > PAGE_SIZE && (
                  <p className="text-[11px] text-green-400">
                    All {filteredProducts.length} products shown
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-24 text-center px-8">
              <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mb-5 shadow-sm">
                <span className="text-4xl">🔍</span>
              </div>
              <h3 className="text-[16px] font-bold text-gray-800">Nothing found</h3>
              <p className="text-gray-400 mt-1.5 text-sm">
                Try a different word or pick a category
              </p>
              <button
                onClick={() => { setSearchTerm(""); setSelectedCategory("All"); }}
                className="mt-5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
              >
                Show All
              </button>
            </div>
          )}
        </div>
      </div>

      <CartDrawer />
    </div>
  );
}
