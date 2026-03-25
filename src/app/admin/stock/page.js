"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Loader2, PackageCheck, Plus, Minus, AlertTriangle,
  CheckSquare, Square, Filter, Zap, XCircle, LayoutList, Save
} from "lucide-react";
import AdminNav from "@/components/AdminNav";

const DEFAULT_STOCK = 10;

const PRESETS = [
  { label: "0 (Out)", value: 0, color: "bg-red-600 hover:bg-red-500" },
  { label: "2", value: 2, color: "bg-slate-700 hover:bg-slate-600" },
  { label: "4", value: 4, color: "bg-slate-700 hover:bg-slate-600" },
  { label: "5", value: 5, color: "bg-slate-700 hover:bg-slate-600" },
  { label: "8", value: 8, color: "bg-slate-700 hover:bg-slate-600" },
  { label: "10 ★", value: 10, color: "bg-blue-600 hover:bg-blue-500" },
  { label: "15", value: 15, color: "bg-slate-700 hover:bg-slate-600" },
  { label: "20", value: 20, color: "bg-slate-700 hover:bg-slate-600" },
];

export default function StockAdminPage() {
  // Source of truth loaded from server
  const [savedProducts, setSavedProducts] = useState([]);
  // Local working copy (edits happen here only)
  const [localStock, setLocalStock] = useState({}); // { [id]: number }
  const [categories, setCategories] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [toast, setToast] = useState(null);
  const [filtered, setFiltered] = useState([]);
  const searchTimerRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [customBulk, setCustomBulk] = useState("");

  const load = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories")
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      const formatted = prodData.map(p => ({
        ...p,
        stockCount: p.stockCount !== undefined ? p.stockCount : DEFAULT_STOCK
      }));
      setSavedProducts(formatted);
      // Initialize local stock to match server
      const initLocal = {};
      formatted.forEach(p => { initLocal[p.id] = p.stockCount; });
      setLocalStock(initLocal);
      setCategories(catData);
    } catch {
      showToast("❌ Failed to load");
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtering (uses localStock for display)
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const term = search.toLowerCase();
      const result = savedProducts.filter(p => {
        const matchSearch = p.name?.toLowerCase().includes(term);
        const matchCat = selectedCategory === "All" || p.category === selectedCategory;
        return matchSearch && matchCat;
      });
      result.sort((a, b) => {
        const sa = localStock[a.id] ?? 0;
        const sb = localStock[b.id] ?? 0;
        if (sa <= 0 && sb > 0) return -1;
        if (sa > 0 && sb <= 0) return 1;
        if (sa <= 3 && sb > 3) return -1;
        if (sa > 3 && sb <= 3) return 1;
        return (a.name || "").localeCompare(b.name || "");
      });
      setFiltered(result);
    }, 150);
    return () => clearTimeout(searchTimerRef.current);
  }, [search, savedProducts, selectedCategory, localStock]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Local update only — no API call
  const setOne = (id, value) => {
    const v = Math.max(0, value);
    setLocalStock(prev => ({ ...prev, [id]: v }));
  };

  // Bulk set preset to selected/all
  const bulkSet = (value) => {
    const targetIds = selectedIds.size > 0
      ? Array.from(selectedIds)
      : filtered.map(p => p.id);
    if (!targetIds.length) return;
    setLocalStock(prev => {
      const next = { ...prev };
      targetIds.forEach(id => { next[id] = value; });
      return next;
    });
  };

  // ─── SAVE ALL to Firestore ───
  const saveAll = async () => {
    // Figure out which ones actually changed
    const changed = savedProducts
      .map(p => ({ id: p.id, stockCount: localStock[p.id] ?? p.stockCount }))
      .filter(p => p.stockCount !== (savedProducts.find(sp => sp.id === p.id)?.stockCount));

    if (changed.length === 0) { showToast("✅ Nothing changed"); return; }

    setIsSaving(true);
    try {
      await Promise.all(changed.map(({ id, stockCount }) =>
        fetch("/api/stock/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, stockCount })
        })
      ));
      // Commit local → saved
      setSavedProducts(prev => prev.map(p => ({
        ...p,
        stockCount: localStock[p.id] ?? p.stockCount
      })));
      showToast(`✅ Saved ${changed.length} item${changed.length > 1 ? "s" : ""}`);
      setSelectedIds(new Set());
    } catch {
      showToast("❌ Some saves failed. Please retry.");
    } finally {
      setIsSaving(false);
    }
  };

  // Selection helpers
  const toggleSelect = (id) =>
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(p => p.id)));
  };

  // Diff counter
  const changedCount = savedProducts.filter(p =>
    (localStock[p.id] ?? p.stockCount) !== p.stockCount
  ).length;

  const outOfStockCount = savedProducts.filter(p => (localStock[p.id] ?? 0) <= 0).length;
  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  if (!isLoaded) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <AdminNav />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-600 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl">
          {toast}
        </div>
      )}

      <div className="max-w-5xl mx-auto w-full p-4 md:p-6 pb-28 flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <PackageCheck className="text-blue-400" size={22} />
              Stock Manager
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Edit freely — nothing saves until you press <strong className="text-slate-300">Save All</strong>.
            </p>
          </div>
          {outOfStockCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-xl font-bold text-xs">
              <AlertTriangle size={13} />
              {outOfStockCount} Sold Out
            </div>
          )}
        </div>

        {/* ═══ POWER ACTIONS TOOLBAR ═══ */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
            <Zap size={13} className="text-yellow-400" />
            Quick Set
            <span className="ml-auto text-slate-600 font-normal normal-case tracking-normal">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : "all visible"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => bulkSet(p.value)}
                className={`${p.color} text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 shadow-sm`}
              >
                {p.label}
              </button>
            ))}

            <div className="flex items-center gap-0 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <input
                type="number"
                min={0}
                placeholder="Custom…"
                value={customBulk}
                onChange={e => setCustomBulk(e.target.value)}
                className="w-20 bg-transparent px-2 py-1.5 text-xs font-bold text-slate-200 outline-none placeholder-slate-600"
              />
              <button
                onClick={() => {
                  const v = parseInt(customBulk, 10);
                  if (!isNaN(v) && v >= 0) { bulkSet(v); setCustomBulk(""); }
                  else showToast("Enter a valid number");
                }}
                disabled={customBulk === ""}
                className="bg-slate-600 hover:bg-slate-500 px-3 py-1.5 text-xs font-black text-white disabled:opacity-40 transition-colors"
              >
                Set
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800">
            <button
              onClick={() => bulkSet(DEFAULT_STOCK)}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95"
            >
              <PackageCheck size={13} /> Reset All to {DEFAULT_STOCK}
            </button>
            <button
              onClick={() => bulkSet(0)}
              className="flex items-center gap-1.5 bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95"
            >
              <XCircle size={13} /> Stock Out All
            </button>
          </div>
        </div>

        {/* ═══ FILTERS & SELECT ALL ═══ */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={toggleSelectAll}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all
              ${allSelected
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"}`}
          >
            {allSelected ? <CheckSquare size={13} /> : <Square size={13} />}
            {allSelected ? "Deselect All" : "Select All"}
          </button>

          {selectedIds.size > 0 && (
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 transition-all"
            >
              Clear ({selectedIds.size})
            </button>
          )}

          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-2.5 top-2.5 text-slate-500" size={13} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-2.5 top-2.5 text-slate-500" size={13} />
            <select
              className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="All">All</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.title}>{cat.title}</option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-600 ml-auto flex items-center gap-1">
            <LayoutList size={12} /> {filtered.length} items
          </span>
        </div>

        {/* ═══ LIST ═══ */}
        <div className="flex flex-col gap-1.5">
          {filtered.length > 0 ? filtered.map(p => {
            const stock = localStock[p.id] ?? p.stockCount;
            const savedStock = p.stockCount;
            const isDirty = stock !== savedStock;
            const isOOS = stock <= 0;
            const isLow = stock > 0 && stock <= 3;
            const isSelected = selectedIds.has(p.id);

            return (
              <div
                key={p.id}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border transition-all ring-2
                  ${isOOS ? "bg-red-950/30 border-red-900/40" : isLow ? "bg-orange-950/20 border-orange-900/30" : "bg-slate-950 border-slate-800"}
                  ${isSelected ? "ring-blue-500" : "ring-transparent"}
                  ${isDirty ? "border-l-4 border-l-yellow-500" : ""}`}
              >
                {/* Checkbox */}
                <button onClick={() => toggleSelect(p.id)} className="text-slate-500 hover:text-blue-400 flex-shrink-0">
                  {isSelected ? <CheckSquare size={18} className="text-blue-400" /> : <Square size={18} />}
                </button>

                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
                  {p.image
                    /* eslint-disable-next-line @next/next/no-img-element */
                    ? <img src={p.image} className="w-full h-full object-cover" alt="" />
                    : <span className="text-lg">{p.emoji || "📦"}</span>
                  }
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isOOS ? "text-slate-500 line-through" : "text-slate-200"}`}>{p.name}</p>
                  <p className="text-[10px] text-slate-600">{p.category}</p>
                </div>

                {/* Dirty indicator */}
                {isDirty && (
                  <span className="text-[9px] font-black text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded hidden sm:block flex-shrink-0">
                    {savedStock} → {stock}
                  </span>
                )}

                {/* Per-row quick pills */}
                <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                  {[0, 2, 5, 10].map(v => (
                    <button
                      key={v}
                      onClick={() => setOne(p.id, v)}
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg transition-all
                        ${v === 0 ? "bg-red-900/50 text-red-400 hover:bg-red-800" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"}
                        ${stock === v ? "ring-1 ring-blue-500" : ""}`}
                    >
                      {v === 0 ? "🚫" : v}
                    </button>
                  ))}
                </div>

                {/* Stepper */}
                <div className="flex items-center bg-slate-800 rounded-xl p-0.5 flex-shrink-0">
                  <button
                    onClick={() => setOne(p.id, stock - 1)}
                    disabled={isOOS}
                    className="w-9 h-9 flex items-center justify-center text-red-400 hover:bg-slate-700 rounded-lg transition-colors active:scale-90 disabled:opacity-30"
                  >
                    <Minus size={16} strokeWidth={3} />
                  </button>
                  <div className={`w-10 text-center font-black text-base select-none
                    ${isOOS ? "text-red-400" : isLow ? "text-orange-400" : "text-white"}`}>
                    {isOOS ? "0" : stock}
                  </div>
                  <button
                    onClick={() => setOne(p.id, stock + 1)}
                    className="w-9 h-9 flex items-center justify-center text-emerald-400 hover:bg-slate-700 rounded-lg transition-colors active:scale-90"
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
              <PackageCheck size={40} className="mb-3 opacity-20" />
              <p className="text-sm">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ STICKY SAVE BAR ═══ */}
      <div className="fixed bottom-0 inset-x-0 bg-slate-950/95 backdrop-blur border-t border-slate-800 px-4 py-3 flex items-center justify-between gap-4 z-40">
        <div className="text-xs text-slate-500">
          {changedCount > 0
            ? <span className="text-yellow-400 font-bold">{changedCount} unsaved change{changedCount > 1 ? "s" : ""}</span>
            : <span>No unsaved changes</span>
          }
        </div>
        <button
          onClick={saveAll}
          disabled={isSaving || changedCount === 0}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black px-6 py-2.5 rounded-2xl text-sm transition-all active:scale-95 shadow-lg shadow-emerald-600/20 disabled:shadow-none"
        >
          {isSaving
            ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
            : <><Save size={16} /> Save All {changedCount > 0 ? `(${changedCount})` : ""}</>
          }
        </button>
      </div>
    </div>
  );
}
