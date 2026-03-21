"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import CategorySidebar from "@/components/CategorySidebar";
import ProductCard from "@/components/ProductCard";
import ProductListItem from "@/components/ProductListItem";
import CartDrawer from "@/components/CartDrawer";
import { Clock, Loader2, Sparkles } from "lucide-react";
import Fuse from "fuse.js";
import Link from "next/link";

const PAGE_SIZE = 40;

/* ── Delivery promise badges shown in the hero ── */
const PROMISES = [
  { emoji: "🕐", text: "4-5 hr delivery" },
  { emoji: "📍", text: "3 km range" },
  { emoji: "🏪", text: "Local store" },
  { emoji: "🌿", text: "Fresh daily" },
];

export default function Home() {
  const [allProducts, setAllProducts] = useState([]);     // fetched from Firestore via API
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [pastItems, setPastItems] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loaderRef  = useRef(null);
  const contentRef = useRef(null);

  // Fetch products from Firestore (via API) and filter out hidden ones
  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        // Filter out products where hidden === true
        setAllProducts(Array.isArray(data) ? data.filter((p) => !p.hidden) : []);
        setProductsLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to load products", err);
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

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(allProducts.map((p) => p.category)))],
    [allProducts]
  );

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

  /* ─── Skeleton loader ─── */
  if (!isHydrated || !productsLoaded) {
    return (
      <div className="h-screen flex flex-col" style={{ background: "#f0faf4" }}>
        {/* Fake header */}
        <div className="h-[168px] shimmer flex-shrink-0 rounded-b-3xl" />
        <div className="flex flex-1 overflow-hidden mt-1">
          <div className="w-[72px] shimmer" />
          <div className="flex-1 grid grid-cols-2 gap-3 p-3">
            {[1,2,3,4].map(i => <div key={i} className="h-52 shimmer rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Full page ─── */
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#f0faf4" }}>

      {/* ══════════════════════════════════════════
          STICKY HEADER  
      ══════════════════════════════════════════ */}
      <header className="flex-shrink-0 header-glass safe-top z-40">

        {/* ── Hero banner ── */}
        <div
          className="relative overflow-hidden px-4 pt-4 pb-5"
          style={{
            background: "linear-gradient(135deg, #064e3b 0%, #065f46 40%, #059669 80%, #10b981 100%)",
          }}
        >
          {/* Animated background blobs */}
          <div
            className="blob absolute -top-6 -right-6 w-40 h-40 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
          />
          <div
            className="blob blob-delay absolute bottom-0 left-1/3 w-28 h-28 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #a7f3d0 0%, transparent 70%)" }}
          />
          {/* Decorative circles */}
          <div className="absolute top-3 right-14 w-8 h-8 border border-white/20 rounded-full" />
          <div className="absolute top-6 right-20 w-4 h-4 border border-white/15 rounded-full" />
          <div className="absolute bottom-3 left-4 w-5 h-5 border border-white/20 rounded-full" />

          {/* Top row: logo + orders */}
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Store icon */}
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🛒</span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-white font-black text-[19px] tracking-tight leading-none">
                    Palathingal
                  </h1>
                  {/* Verified-store badge like Zepto */}
                  <span className="bg-white/25 border border-white/30 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Sparkles size={9} strokeWidth={2.5} />
                    Stores
                  </span>
                </div>
                <p className="text-emerald-200 text-[11.5px] font-medium mt-0.5 tracking-wide">
                  Fresh • Local • Fast
                </p>
              </div>
            </div>

            {/* Orders button */}
            <Link
              href="/orders"
              className="w-9 h-9 bg-white/15 border border-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center active:bg-white/25 transition-colors"
            >
              <Clock size={17} className="text-white" strokeWidth={2} />
            </Link>
          </div>

          {/* Promise badges row */}
          <div className="relative flex items-center gap-2 mb-4 flex-wrap">
            {PROMISES.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-1 bg-white/15 border border-white/20 rounded-full px-2.5 py-1"
              >
                <span className="text-[13px]">{p.emoji}</span>
                <span className="text-white text-[11px] font-semibold">{p.text}</span>
              </div>
            ))}
            {/* Minimum order badge */}
            <div className="flex items-center gap-1 bg-yellow-300/20 border border-yellow-300/40 rounded-full px-2.5 py-1">
              <span className="text-[13px]">🛒</span>
              <span className="text-yellow-200 text-[11px] font-semibold">Min. order ₹300</span>
            </div>
          </div>

          {/* Search bar — sits at the bottom of the hero, overlapping the white section */}
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
