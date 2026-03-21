"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Scale,
  CheckSquare,
  Square,
  Loader2,
  Save,
  X,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import AdminNav from "@/components/AdminNav";
import { SLAB_LIST, WEIGHT_SLABS } from "@/lib/weight-slabs";

const SLAB_COLORS = {
  purple: { bg: "bg-purple-600", hover: "hover:bg-purple-500", ring: "ring-purple-500", text: "text-purple-300", badge: "bg-purple-900/40 text-purple-300 border-purple-700/40" },
  orange: { bg: "bg-orange-600", hover: "hover:bg-orange-500", ring: "ring-orange-500", text: "text-orange-300", badge: "bg-orange-900/40 text-orange-300 border-orange-700/40" },
  green:  { bg: "bg-green-600",  hover: "hover:bg-green-500",  ring: "ring-green-500",  text: "text-green-300",  badge: "bg-green-900/40 text-green-300 border-green-700/40" },
  blue:   { bg: "bg-blue-600",   hover: "hover:bg-blue-500",   ring: "ring-blue-500",   text: "text-blue-300",   badge: "bg-blue-900/40 text-blue-300 border-blue-700/40" },
};

export default function WeightSlabAdminPage() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [pendingSlab, setPendingSlab] = useState(null); // slab key to assign, or "clear"
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [error, setError] = useState(null);
  const searchTimerRef = useRef(null);

  // --- Data loading ---
  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
        setIsLoaded(true);
      })
      .catch((e) => { setError(e.message); setIsLoaded(true); });
  }, []);

  // --- Filter ---
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const term = search.toLowerCase();
      const result = products.filter((p) => {
        const matchSearch = p.name?.toLowerCase().includes(term);
        const matchCat = selectedCategory === "All" || p.category === selectedCategory;
        return matchSearch && matchCat;
      });
      // Uncapped — show all matching results when user is searching
      const shouldCap = selectedCategory === "All" && !term;
      setFiltered(shouldCap ? result.slice(0, 80) : result);
    }, 250);
    return () => clearTimeout(searchTimerRef.current);
  }, [search, products, selectedCategory]);

  // --- Selection ---
  const toggle = (id) => {
    setSaveResult(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectAll = () => {
    setSaveResult(null);
    setSelectedIds((prev) => { const n = new Set(prev); filtered.forEach((p) => n.add(p.id)); return n; });
  };
  const deselectAll = () => { setSaveResult(null); setSelectedIds(new Set()); };
  const allSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));

  // --- Save ---
  const handleSave = async () => {
    if (selectedIds.size === 0 || !pendingSlab) return;
    setIsSaving(true);
    setSaveResult(null);
    try {
      const updates = [...selectedIds].map((id) => ({
        id,
        weightSlab: pendingSlab === "clear" ? null : pendingSlab,
      }));
      const res = await fetch("/api/products/update-weight-slab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (res.ok) {
        // Update local state
        setProducts((prev) =>
          prev.map((p) => {
            if (selectedIds.has(p.id)) {
              const updated = { ...p };
              if (pendingSlab === "clear") {
                delete updated.weightSlab;
              } else {
                updated.weightSlab = pendingSlab;
              }
              return updated;
            }
            return p;
          })
        );
        setSaveResult({ ok: true, count: data.modifiedCount });
        setSelectedIds(new Set());
        setPendingSlab(null);
      } else {
        setSaveResult({ ok: false, msg: data.error });
      }
    } catch (e) {
      setSaveResult({ ok: false, msg: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={48} />
    </div>
  );

  if (error) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-red-400 p-8 font-mono">
      <p className="text-xl font-bold mb-2">Failed to load products</p>
      <p className="text-sm bg-slate-900 p-4 rounded border border-red-900/50 max-w-md text-center">{error}</p>
    </div>
  );

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden font-mono">
      <AdminNav />

      <div className="flex flex-1 overflow-hidden">
        {/* ───── Sidebar ───── */}
        <div className="w-96 border-r border-slate-800 flex flex-col bg-slate-900">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Scale size={18} className="text-blue-400" />
              Portion Slabs
            </h2>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Category filter */}
            <div className="relative mb-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.title}>{c.title}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Select all toolbar */}
            <div className="flex items-center justify-between">
              <button
                onClick={allSelected ? deselectAll : selectAll}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                {allSelected
                  ? <CheckSquare size={13} className="text-blue-400" />
                  : <Square size={13} className="text-slate-400" />}
                {allSelected ? "Deselect All" : "Select All"}
              </button>
              {selectedIds.size > 0 && (
                <span className="text-xs text-blue-400 font-bold">{selectedIds.size} selected</span>
              )}
            </div>
          </div>

          {/* Product list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map((p) => {
              const isSelected = selectedIds.has(p.id);
              const slab = p.weightSlab ? WEIGHT_SLABS[p.weightSlab] : null;
              const colors = slab ? SLAB_COLORS[slab.color] : null;
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className={`w-full text-left p-3 border-b border-slate-800/50 flex items-center gap-3 hover:bg-slate-800/50 transition-colors
                    ${isSelected ? "bg-blue-600/20 border-l-4 border-l-blue-500" : "border-l-4 border-l-transparent"}`}
                >
                  <div className="flex-shrink-0">
                    {isSelected
                      ? <CheckSquare size={15} className="text-blue-400" />
                      : <Square size={15} className="text-slate-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold leading-snug truncate">{p.name || "Untitled"}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      ID: {p.id} · ₹{p.price} · {p.unit}
                    </div>
                  </div>
                  {slab && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colors.badge} flex-shrink-0`}>
                      {slab.shortLabel}
                    </span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center text-slate-600 py-16 text-sm">No products found.</div>
            )}
          </div>

          {/* Stats */}
          <div className="p-3 border-t border-slate-800 text-xs text-slate-500">
            {products.filter((p) => p.weightSlab).length} / {products.length} products have slabs
          </div>
        </div>

        {/* ───── Main panel ───── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center px-6 gap-4">
            {selectedIds.size === 0 ? (
              <span className="text-slate-500 text-sm">← Select products, then assign a slab</span>
            ) : (
              <span className="text-sm text-blue-300 font-bold">{selectedIds.size} product{selectedIds.size > 1 ? "s" : ""} selected</span>
            )}

            <div className="ml-auto flex items-center gap-3">
              {pendingSlab && (
                <button
                  onClick={() => setPendingSlab(null)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <X size={12} /> Clear selection
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={selectedIds.size === 0 || !pendingSlab || isSaving}
                className="flex items-center gap-2 px-5 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold transition-colors"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save
              </button>
            </div>
          </div>

          {/* Save result banner */}
          {saveResult && (
            <div className={`px-6 py-2 text-sm flex items-center gap-2 ${saveResult.ok ? "bg-green-900/30 text-green-300 border-b border-green-800/30" : "bg-red-900/30 text-red-300 border-b border-red-800/30"}`}>
              {saveResult.ok
                ? <><CheckCircle2 size={14} /> Saved slab for {saveResult.count} product{saveResult.count !== 1 ? "s" : ""}</>
                : <>⚠ {saveResult.msg}</>}
              <button onClick={() => setSaveResult(null)} className="ml-auto opacity-60 hover:opacity-100"><X size={13} /></button>
            </div>
          )}

          {/* Slab selector */}
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              Choose a slab to assign
            </h3>

            <div className="grid grid-cols-2 gap-4 max-w-2xl">
              {SLAB_LIST.map((slab) => {
                const colors = SLAB_COLORS[slab.color];
                const isActive = pendingSlab === slab.key;
                return (
                  <button
                    key={slab.key}
                    onClick={() => setPendingSlab(isActive ? null : slab.key)}
                    className={`rounded-xl p-5 text-left border transition-all ${
                      isActive
                        ? `${colors.bg} border-transparent ring-2 ${colors.ring}`
                        : "bg-slate-800/60 border-slate-700 hover:bg-slate-800"
                    }`}
                  >
                    <div className="text-2xl font-black mb-1">{slab.shortLabel}</div>
                    <div className="text-sm font-semibold mb-1">{slab.label}</div>
                    <div className="text-xs opacity-70">
                      Min: {slab.min} · Max: {slab.max} · Step: {slab.step}
                    </div>
                    <div className={`text-xs mt-2 ${isActive ? "opacity-80" : "opacity-50"}`}>
                      e.g. {slab.example}
                    </div>
                  </button>
                );
              })}

              {/* Clear slab card */}
              <button
                onClick={() => setPendingSlab(pendingSlab === "clear" ? null : "clear")}
                className={`rounded-xl p-5 text-left border transition-all ${
                  pendingSlab === "clear"
                    ? "bg-red-700 border-transparent ring-2 ring-red-500"
                    : "bg-slate-800/60 border-slate-700 hover:bg-slate-800"
                }`}
              >
                <div className="text-2xl mb-1"><X size={24} /></div>
                <div className="text-sm font-semibold mb-1">Remove Slab</div>
                <div className="text-xs opacity-70">Revert to unit-based selling</div>
              </button>
            </div>

            {/* Preview */}
            {pendingSlab && pendingSlab !== "clear" && selectedIds.size > 0 && (
              <div className="mt-8 max-w-2xl bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Preview</p>
                <p className="text-sm text-slate-300">
                  Selected <span className="font-bold text-white">{selectedIds.size}</span> product{selectedIds.size > 1 ? "s" : ""} will sell in{" "}
                  <span className={`font-bold ${SLAB_COLORS[WEIGHT_SLABS[pendingSlab].color].text}`}>
                    {WEIGHT_SLABS[pendingSlab].step}
                  </span>{" "}
                  increments.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Customers can pick {WEIGHT_SLABS[pendingSlab].min} →{" "}
                  {WEIGHT_SLABS[pendingSlab].max}. Price auto-calculated from the base price.
                </p>
              </div>
            )}

            {pendingSlab === "clear" && selectedIds.size > 0 && (
              <div className="mt-8 max-w-2xl bg-red-900/20 border border-red-800/30 rounded-xl p-5">
                <p className="text-sm text-red-300">
                  Slab will be <span className="font-bold">removed</span> from {selectedIds.size} product{selectedIds.size > 1 ? "s" : ""}. They will revert to standard unit-based selling.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
