"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search, Save, Loader2, ChevronDown, CheckSquare, Square,
  FolderOpen, AlertCircle, Plus, X, RotateCcw
} from "lucide-react";

const CATEGORY_EMOJI = {
  "GROCERY": "🌾",
  "OILS": "🫙",
  "BEVERAGES": "🥤",
  "INSTANT FOOD": "🍜",
  "TOILETRIES": "🧴",
  "DISINFECTANTS": "🧹",
  "MEDICAL PRODUCTS": "💊",
  "VEGETABLES": "🥦",
  "STATIONERY": "✏️",
};

export default function CategoryEditorPage() {
  const [products, setProducts] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Pending changes: Map of id → new category (in-memory, not yet saved)
  const [pendingChanges, setPendingChanges] = useState(new Map());

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [moveTarget, setMoveTarget] = useState("");
  const [newCatInput, setNewCatInput] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const searchTimerRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Load products
  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(data => { setProducts(data); setIsLoaded(true); })
      .catch(e => { setError(e.message); setIsLoaded(true); });
  }, []);

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(searchTimerRef.current);
  }, [search]);

  // Effective products: apply pending changes to derive current state
  const effectiveProducts = useMemo(() =>
    products.map(p => {
      const pending = pendingChanges.get(p.id);
      return pending !== undefined ? { ...p, category: pending } : p;
    }), [products, pendingChanges]);

  // All unique categories (from effective state + any new ones added)
  const allCategories = useMemo(() => {
    const cats = new Set(effectiveProducts.map(p => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [effectiveProducts]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts = {};
    effectiveProducts.forEach(p => {
      if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [effectiveProducts]);

  // Which categories have pending moves
  const dirtyCats = useMemo(() => {
    const dirty = new Set();
    pendingChanges.forEach((newCat, id) => {
      const orig = products.find(p => p.id === id);
      if (orig) {
        dirty.add(orig.category);
        dirty.add(newCat);
      }
    });
    return dirty;
  }, [pendingChanges, products]);

  // Products visible in the right panel
  const visibleProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return effectiveProducts.filter(p => {
      const matchCat = p.category === selectedCategory;
      const matchSearch = !debouncedSearch ||
        p.name?.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [effectiveProducts, selectedCategory, debouncedSearch]);

  const allVisibleChecked = visibleProducts.length > 0 &&
    visibleProducts.every(p => checkedIds.has(p.id));

  // Auto-select first category after load
  useEffect(() => {
    if (isLoaded && allCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(allCategories[0]);
    }
  }, [isLoaded, allCategories, selectedCategory]);

  // Clear checked when category changes
  useEffect(() => {
    setCheckedIds(new Set());
    setSearch("");
    setMoveTarget("");
  }, [selectedCategory]);

  const toggleCheck = (id) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allVisibleChecked) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(visibleProducts.map(p => p.id)));
    }
  };

  const handleMove = () => {
    const target = moveTarget.trim().toUpperCase();
    if (!target || checkedIds.size === 0) return;
    setPendingChanges(prev => {
      const next = new Map(prev);
      checkedIds.forEach(id => next.set(id, target));
      return next;
    });
    setSaveResult(null);
    setCheckedIds(new Set());
    setMoveTarget("");
  };

  const handleDiscard = () => {
    setPendingChanges(new Map());
    setCheckedIds(new Set());
    setSaveResult(null);
  };

  const handleSave = async () => {
    if (pendingChanges.size === 0) return;
    setIsSaving(true);
    setSaveResult(null);

    const updates = Array.from(pendingChanges.entries()).map(([id, category]) => ({ id, category }));

    try {
      const res = await fetch("/api/products/update-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (res.ok) {
        // Commit pending changes into local products state
        setProducts(prev => prev.map(p => {
          const newCat = pendingChanges.get(p.id);
          return newCat !== undefined ? { ...p, category: newCat } : p;
        }));
        setPendingChanges(new Map());
        setSaveResult({ ok: true, count: data.updated });
      } else {
        setSaveResult({ ok: false, error: data.error });
      }
    } catch (e) {
      setSaveResult({ ok: false, error: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (!isLoaded) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-400" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-red-400 gap-4">
        <AlertCircle size={40} />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden font-mono">

      {/* ── Top bar ── */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <FolderOpen size={18} className="text-blue-400" />
          <h1 className="font-bold text-[15px]">Category Editor</h1>
          {pendingChanges.size > 0 && (
            <span className="bg-amber-500/20 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
              {pendingChanges.size} unsaved change{pendingChanges.size > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {pendingChanges.size > 0 && (
            <button
              onClick={handleDiscard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RotateCcw size={14} /> Discard
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={pendingChanges.size === 0 || isSaving}
            className="flex items-center gap-2 px-5 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm font-bold transition-colors"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save All
          </button>
        </div>
      </div>

      {/* Save result banner */}
      {saveResult && (
        <div className={`px-6 py-2 text-sm flex items-center gap-3 flex-shrink-0 ${saveResult.ok
          ? "bg-green-900/30 text-green-300 border-b border-green-800/40"
          : "bg-red-900/30 text-red-300 border-b border-red-800/40"}`}
        >
          {saveResult.ok
            ? `✓ ${saveResult.count} product${saveResult.count > 1 ? "s" : ""} updated successfully`
            : `⚠ Save failed: ${saveResult.error}`}
          <button onClick={() => setSaveResult(null)} className="ml-auto opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Category list */}
        <div className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col flex-shrink-0">
          <div className="p-3 text-[11px] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-800">
            Categories ({allCategories.length})
          </div>
          <div className="flex-1 overflow-y-auto">
            {allCategories.map(cat => {
              const isActive = selectedCategory === cat;
              const isDirty = dirtyCats.has(cat);
              const count = categoryCounts[cat] || 0;
              const emoji = CATEGORY_EMOJI[cat] || "📦";
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 border-b border-slate-800/40 text-left transition-colors
                    ${isActive
                      ? "bg-blue-600/20 border-l-2 border-l-blue-500"
                      : "border-l-2 border-l-transparent hover:bg-slate-800/50"}`}
                >
                  <span className="text-base leading-none flex-shrink-0">{emoji}</span>
                  <span className={`flex-1 text-[12px] font-semibold leading-tight ${isActive ? "text-blue-200" : "text-slate-300"}`}>
                    {cat}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    <span className={`text-[11px] font-bold ${isActive ? "text-blue-300" : "text-slate-500"}`}>
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Add new category */}
          <div className="p-2 border-t border-slate-800">
            {showNewCat ? (
              <div className="flex gap-1">
                <input
                  autoFocus
                  type="text"
                  value={newCatInput}
                  onChange={e => setNewCatInput(e.target.value.toUpperCase())}
                  onKeyDown={e => {
                    if (e.key === "Enter" && newCatInput.trim()) {
                      setSelectedCategory(newCatInput.trim());
                      setNewCatInput("");
                      setShowNewCat(false);
                    }
                    if (e.key === "Escape") { setShowNewCat(false); setNewCatInput(""); }
                  }}
                  placeholder="NEW CATEGORY"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs uppercase outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => { setShowNewCat(false); setNewCatInput(""); }}
                  className="p-1 text-slate-500 hover:text-red-400"
                ><X size={14} /></button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewCat(true)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[12px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Plus size={13} /> New Category
              </button>
            )}
          </div>
        </div>

        {/* Right: Product list */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Right toolbar */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
            {/* Select all checkbox */}
            <button onClick={toggleAll} className="flex-shrink-0">
              {allVisibleChecked
                ? <CheckSquare size={16} className="text-blue-400" />
                : <Square size={16} className="text-slate-600" />}
            </button>

            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2 text-slate-500" size={13} />
              <input
                type="text"
                placeholder="Search in category…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Checked count */}
            {checkedIds.size > 0 && (
              <span className="text-xs text-blue-400 font-bold flex-shrink-0">
                {checkedIds.size} selected
              </span>
            )}

            {/* Move controls — only when something is checked */}
            {checkedIds.size > 0 && (
              <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                <span className="text-xs text-slate-500">Move to →</span>
                <div className="relative">
                  <select
                    value={moveTarget}
                    onChange={e => setMoveTarget(e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs appearance-none pr-7 cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Pick category…</option>
                    {allCategories
                      .filter(c => c !== selectedCategory)
                      .map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="__NEW__">+ Type new…</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
                </div>

                {/* Custom category name input when "Type new" selected */}
                {moveTarget === "__NEW__" && (
                  <input
                    autoFocus
                    type="text"
                    placeholder="NEW CATEGORY NAME"
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        const val = e.target.value.trim().toUpperCase();
                        if (val) setMoveTarget(val);
                      }
                    }}
                    className="bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-xs uppercase w-40 focus:outline-none focus:border-blue-500"
                  />
                )}

                <button
                  onClick={handleMove}
                  disabled={!moveTarget || moveTarget === "__NEW__"}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs font-bold transition-colors"
                >
                  Move
                </button>
              </div>
            )}

            {/* Heading when nothing checked */}
            {checkedIds.size === 0 && selectedCategory && (
              <span className="ml-auto text-[11px] text-slate-500">
                {visibleProducts.length} product{visibleProducts.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Product list */}
          <div className="flex-1 overflow-y-auto">
            {!selectedCategory ? (
              <div className="flex items-center justify-center h-full text-slate-600 text-sm">
                Select a category to start
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-600 text-sm">
                {debouncedSearch ? "No products match your search" : "No products in this category"}
              </div>
            ) : (
              visibleProducts.map(p => {
                const isChecked = checkedIds.has(p.id);
                const isPending = pendingChanges.has(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleCheck(p.id)}
                    className={`flex items-center gap-3 px-4 py-2.5 border-b border-slate-800/40 cursor-pointer transition-colors select-none
                      ${isChecked ? "bg-blue-600/15" : "hover:bg-slate-800/30"}
                      ${isPending ? "border-l-2 border-l-amber-400" : "border-l-2 border-l-transparent"}`}
                  >
                    <div className="flex-shrink-0">
                      {isChecked
                        ? <CheckSquare size={15} className="text-blue-400" />
                        : <Square size={15} className="text-slate-700" />}
                    </div>

                    {/* Thumbnail */}
                    <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {p.image
                        ? <img src={p.image} className="w-full h-full object-cover" loading="lazy" alt="" />
                        : <span className="text-[16px]">📦</span>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-200 leading-tight">
                        {p.name || <span className="text-slate-600 italic">Untitled</span>}
                      </p>
                      <p className="text-[10px] text-slate-500">ID: {p.id} · ₹{p.price} · {p.unit}</p>
                    </div>

                    {isPending && (
                      <span className="text-[10px] text-amber-400 font-bold flex-shrink-0">
                        → {pendingChanges.get(p.id)}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
