"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2, PackageCheck, Plus, Minus, RotateCcw, Filter, AlertTriangle } from "lucide-react";
import AdminNav from "@/components/AdminNav";

export default function StockAdminPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [toast, setToast] = useState(null);
  
  // Track updating items to show loaders on immediate buttons
  const [updatingId, setUpdatingId] = useState(null);

  const searchTimerRef = useRef(null);
  const [filtered, setFiltered] = useState([]);

  const load = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories")
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      
      // Ensure every product has a stockCount (default 999 if undefined)
      const formattedProd = prodData.map(p => ({
        ...p,
        stockCount: p.stockCount !== undefined ? p.stockCount : 999
      }));
      
      setProducts(formattedProd);
      setCategories(catData);
    } catch (e) {
      showToast("❌ Failed to load data");
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Filtering
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const term = search.toLowerCase();
      const result = products.filter(p => {
        const matchSearch = p.name?.toLowerCase().includes(term);
        const matchCat = selectedCategory === "All" || p.category === selectedCategory;
        return matchSearch && matchCat && !p.hidden; // only show visible products in stock manager usually
      });
      // Sort: Out of stock first, then low stock, then alphabetical
      result.sort((a, b) => {
        if (a.stockCount <= 0 && b.stockCount > 0) return -1;
        if (a.stockCount > 0 && b.stockCount <= 0) return 1;
        if (a.stockCount < 5 && b.stockCount >= 5) return -1;
        if (a.stockCount >= 5 && b.stockCount < 5) return 1;
        return (a.name || "").localeCompare(b.name || "");
      });
      setFiltered(result);
    }, 200);
    return () => clearTimeout(searchTimerRef.current);
  }, [search, products, selectedCategory]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const updateStock = async (id, delta, setAbsolute = null) => {
    setUpdatingId(id);
    try {
      const product = products.find(p => p.id === id);
      if (!product) return;
      
      let newCount = setAbsolute !== null ? setAbsolute : product.stockCount + delta;
      if (newCount < 0) newCount = 0; // Prevent negative stock

      // Optimistic UI update
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stockCount: newCount } : p));

      const res = await fetch("/api/stock/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, stockCount: newCount })
      });

      if (!res.ok) throw new Error("Failed to update stock");
      
    } catch (e) {
      showToast("❌ Error: " + e.message);
      // Revert on failure (could be complex, so we just reload for safety if it fails)
      load();
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isLoaded) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  const outOfStockCount = products.filter(p => p.stockCount <= 0).length;

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden font-mono">
      <AdminNav />
      
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-700 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PackageCheck className="text-blue-400" size={24} />
              Stock Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Easily update stock quantities. Out-of-stock items will be disabled for customers.
            </p>
          </div>
          
          {outOfStockCount > 0 && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-xl font-bold text-sm shadow-inner">
              <AlertTriangle size={16} />
              {outOfStockCount} Out of Stock
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-3 text-slate-500" size={18} />
            <select
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all cursor-pointer"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.title}>{cat.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto bg-slate-900 rounded-3xl border border-slate-800 shadow-inner p-2 pr-1">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filtered.map(p => {
                const stock = p.stockCount;
                const isOOS = stock <= 0;
                const isLow = stock > 0 && stock <= 5;
                const isPlentiful = stock >= 99; // Assume 99+ is "plenty"
                const isUpdating = updatingId === p.id;
                
                // Styling based on stock status
                let statusColor = "text-green-500 border-green-500/20 bg-green-500/10";
                if (isOOS) statusColor = "text-red-500 border-red-500/30 bg-red-500/20";
                else if (isLow) statusColor = "text-orange-400 border-orange-400/30 bg-orange-400/20";
                else if (isPlentiful) statusColor = "text-blue-400 border-blue-400/20 bg-blue-400/10";

                return (
                  <div 
                    key={p.id} 
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isOOS ? 'border-red-900/40 bg-red-950/20' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border flex-shrink-0 ${statusColor}`}>
                        {p.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={p.image} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-xl">{p.emoji || "📦"}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className={`font-bold text-sm truncate ${isOOS ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                          {p.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {p.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isOOS ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-red-500 tracking-wider">Out of Stock</span>
                          <button 
                            onClick={() => updateStock(p.id, 0, 10)} 
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <RotateCcw size={12} /> Restock (10)
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center bg-slate-800 rounded-xl p-0.5">
                          {/* Minus Button */}
                          <button 
                            onClick={() => updateStock(p.id, -1)}
                            className="w-10 h-10 flex items-center justify-center text-rose-400 hover:bg-slate-700 rounded-lg transition-colors active:scale-95"
                          >
                            <Minus size={18} strokeWidth={3} />
                          </button>
                          
                          {/* Number Display */}
                          <div className={`w-12 text-center font-black text-lg select-none ${isLow ? 'text-orange-400' : isPlentiful ? 'text-blue-400' : 'text-slate-200'}`}>
                            {stock === 999 ? '999+' : stock}
                          </div>
                          
                          {/* Plus Button */}
                          <button 
                            onClick={() => updateStock(p.id, 1)}
                            className="w-10 h-10 flex items-center justify-center text-emerald-400 hover:bg-slate-700 rounded-lg transition-colors active:scale-95"
                          >
                            <Plus size={18} strokeWidth={3} />
                          </button>
                        </div>
                      )}
                      
                      {/* Set to Plenty / 999 Button */}
                      {!isOOS && !isPlentiful && (
                        <button 
                           onClick={() => updateStock(p.id, 0, 999)}
                           title="Set to Plenty (999)"
                           className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors ml-1"
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
              <PackageCheck size={48} className="mb-4 opacity-20" />
              <p>No products found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
