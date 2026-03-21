"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Star, Loader2, CheckSquare, Square, Save, Filter } from "lucide-react";
import AdminNav from "@/components/AdminNav";

export default function FeaturedAdminPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({}); // { id: boolean }

  const RESULTS_CAP = 100;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories")
        ]);
        
        if (!prodRes.ok || !catRes.ok) throw new Error("Failed to fetch data");
        
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        
        setProducts(prodData);
        setCategories(catData);
        setIsLoaded(true);
      } catch (e) {
        setError(e.message);
        setIsLoaded(true);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    const filtered = products.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(term);
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // When showing everything, cap for performance. 
    // If specific search or category, show all matches.
    const shouldCap = selectedCategory === "All" && !term;
    setFilteredProducts(shouldCap ? filtered.slice(0, RESULTS_CAP) : filtered);
  }, [search, products, selectedCategory]);

  const toggleFeatured = (id, currentStatus) => {
    setPendingChanges(prev => {
      const next = { ...prev };
      // If we're toggling back to what's in the products array, remove from pending
      const originalStatus = products.find(p => p.id === id)?.featured || false;
      const newStatus = prev[id] !== undefined ? !prev[id] : !currentStatus;
      
      if (newStatus === originalStatus) {
        delete next[id];
      } else {
        next[id] = newStatus;
      }
      return next;
    });
  };

  const handleSave = async () => {
    const updates = Object.entries(pendingChanges).map(([id, featured]) => ({
      id: Number(id),
      featured
    }));

    if (updates.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/products/update-featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
      });

      if (res.ok) {
        // Update local state
        setProducts(prev => prev.map(p => {
          if (pendingChanges[p.id] !== undefined) {
            return { ...p, featured: pendingChanges[p.id] };
          }
          return p;
        }));
        setPendingChanges({});
        alert("Changes saved successfully!");
      } else {
        throw new Error("Failed to save changes");
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  const hasChanges = Object.keys(pendingChanges).length > 0;

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden font-mono">
      <AdminNav />
      
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Star className="text-yellow-400 fill-yellow-400" size={24} />
              Featured Products
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Select products to showcase on the homepage &quot;Buy Again&quot; or special sections.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={!hasChanges || isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg shadow-blue-600/20"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Changes {hasChanges && `(${Object.keys(pendingChanges).length})`}
          </button>
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
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all"
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
        <div className="flex-1 overflow-y-auto bg-slate-900 rounded-3xl border border-slate-800 shadow-inner">
          {filteredProducts.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {filteredProducts.map(p => {
                const isFeatured = pendingChanges[p.id] !== undefined ? pendingChanges[p.id] : (p.featured || false);
                const isDirty = pendingChanges[p.id] !== undefined;

                return (
                  <div 
                    key={p.id} 
                    className={`flex items-center gap-4 p-4 hover:bg-slate-800/50 transition-colors ${isDirty ? 'bg-blue-600/5' : ''}`}
                  >
                    <button 
                      onClick={() => toggleFeatured(p.id, p.featured)}
                      className="flex-shrink-0 text-blue-400"
                    >
                      {isFeatured ? <CheckSquare size={22} /> : <Square size={22} className="text-slate-600" />}
                    </button>

                    <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-800 flex-shrink-0">
                      {p.image ? (
                        <img src={p.image} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-xl">{p.emoji || "📦"}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-200 truncate">{p.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{p.category} • ₹{p.price}</p>
                    </div>

                    {isFeatured && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-black uppercase tracking-wider">
                        <Star size={10} fill="currentColor" />
                        Featured
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 py-20">
              <Search size={48} className="mb-4 opacity-20" />
              <p>No products found matching your search.</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-center text-[10px] text-slate-600 uppercase tracking-widest font-bold">
          Showing {filteredProducts.length} products
          {selectedCategory === "All" && !search && " (Capped for performance)"}
        </div>
      </div>
    </div>
  );
}
