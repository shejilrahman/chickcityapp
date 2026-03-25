"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, EyeOff, Eye, Loader2, Save, Filter, AlertTriangle,
} from "lucide-react";
import AdminNav from "@/components/AdminNav";

const RESULTS_CAP = 100;

export default function HiddenProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filter, setFilter] = useState("all"); // "all" | "hidden" | "visible"
  const [pendingChanges, setPendingChanges] = useState({}); // { id: boolean }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);
      if (!prodRes.ok || !catRes.ok) throw new Error("Failed to fetch data");
      const [prodData, catData] = await Promise.all([prodRes.json(), catRes.json()]);
      setProducts(prodData);
      setCategories(catData);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase();
    const result = products.filter((p) => {
      const matchSearch = !term || p.name?.toLowerCase().includes(term);
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      const isHidden = pendingChanges[p.id] !== undefined
        ? pendingChanges[p.id]
        : !!p.hidden;
      const matchFilter =
        filter === "all" ||
        (filter === "hidden" && isHidden) ||
        (filter === "visible" && !isHidden);
      return matchSearch && matchCat && matchFilter;
    });

    // Cap if browsing everything
    const shouldCap = selectedCategory === "All" && !term;
    return shouldCap ? result.slice(0, RESULTS_CAP) : result;
  }, [products, search, selectedCategory, filter, pendingChanges]);

  const toggleHidden = (id, currentHidden) => {
    setPendingChanges((prev) => {
      const originalHidden = products.find((p) => p.id === id)?.hidden || false;
      const next = { ...prev };
      const newHidden =
        prev[id] !== undefined ? !prev[id] : !currentHidden;

      if (newHidden === originalHidden) {
        delete next[id];
      } else {
        next[id] = newHidden;
      }
      return next;
    });
  };

  const handleSave = async () => {
    const updates = Object.entries(pendingChanges).map(([id, hidden]) => ({
      id: Number(id),
      hidden,
    }));
    if (updates.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/products/update-hidden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) throw new Error("Failed to save changes");

      // Apply changes to local state
      setProducts((prev) =>
        prev.map((p) =>
          pendingChanges[p.id] !== undefined
            ? { ...p, hidden: pendingChanges[p.id] }
            : p
        )
      );
      setPendingChanges({});
      showToast(`✅ Saved ${updates.length} change${updates.length > 1 ? "s" : ""}!`);
    } catch (e) {
      showToast("❌ " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;
  const hiddenCount = products.filter((p) =>
    (pendingChanges[p.id] !== undefined ? pendingChanges[p.id] : !!p.hidden)
  ).length;

  if (!isLoaded) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-rose-500" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden font-mono">
      <AdminNav />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-700 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <EyeOff className="text-rose-400" size={24} />
              Hidden Products
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Hide products from the store front. Currently{" "}
              <span className="text-rose-400 font-bold">{hiddenCount}</span> product
              {hiddenCount !== 1 ? "s" : ""} hidden.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={!hasChanges || isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold shadow-lg shadow-rose-600/20"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save {hasChanges && `(${Object.keys(pendingChanges).length})`}
          </button>
        </div>

        {/* Warning banner */}
        {hiddenCount > 0 && (
          <div className="mb-4 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold px-4 py-2.5 rounded-xl">
            <AlertTriangle size={14} className="flex-shrink-0" />
            Hidden products are invisible to customers on the store home page.
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 text-slate-500" size={16} />
            <select
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none appearance-none transition-all"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.title}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>

          {/* Visibility filter */}
          <div className="flex rounded-xl overflow-hidden border border-slate-800 text-xs font-bold">
            {[
              { value: "all", label: "All" },
              { value: "hidden", label: "Hidden" },
              { value: "visible", label: "Visible" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`flex-1 py-2.5 transition-colors ${
                  filter === value
                    ? value === "hidden"
                      ? "bg-rose-600 text-white"
                      : "bg-slate-700 text-white"
                    : "bg-slate-900 text-slate-500 hover:text-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto bg-slate-900 rounded-3xl border border-slate-800 shadow-inner">
          {filteredProducts.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {filteredProducts.map((p) => {
                const isHidden =
                  pendingChanges[p.id] !== undefined
                    ? pendingChanges[p.id]
                    : !!p.hidden;
                const isDirty = pendingChanges[p.id] !== undefined;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-4 p-4 hover:bg-slate-800/50 transition-colors ${
                      isDirty ? "bg-rose-600/5" : ""
                    }`}
                  >
                    {/* Toggle */}
                    <button
                      onClick={() => toggleHidden(p.id, !!p.hidden)}
                      title={isHidden ? "Click to show" : "Click to hide"}
                      className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                        isHidden
                          ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                          : "bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
                      }`}
                    >
                      {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>

                    {/* Product image */}
                    <div className="w-11 h-11 rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-800 flex-shrink-0">
                      {p.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={p.image}
                          className={`w-full h-full object-cover ${isHidden ? "opacity-30" : ""}`}
                          alt=""
                        />
                      ) : (
                        <span className={`text-lg ${isHidden ? "opacity-30" : ""}`}>
                          {p.emoji || "📦"}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`font-bold truncate ${
                          isHidden ? "text-slate-500 line-through" : "text-slate-200"
                        }`}
                      >
                        {p.name}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {p.category} • ₹{p.price}
                      </p>
                    </div>

                    {/* Badge */}
                    {isHidden && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-wider flex-shrink-0">
                        <EyeOff size={10} />
                        Hidden
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 py-20">
              <Search size={40} className="mb-3 opacity-20" />
              <p>No products matching your filters.</p>
            </div>
          )}
        </div>

        <div className="mt-3 text-center text-[10px] text-slate-600 uppercase tracking-widest font-bold">
          Showing {filteredProducts.length} products
          {selectedCategory === "All" && !search && filter === "all" && " (Capped for performance)"}
        </div>
      </div>
    </div>
  );
}
